import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

// Verificação do webhook (Meta)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Recebe mensagens do WhatsApp
export async function POST(request: Request) {
  const body = await request.json()

  const entry = body.entry?.[0]
  const change = entry?.changes?.[0]
  const message = change?.value?.messages?.[0]

  if (!message) {
    return NextResponse.json({ status: 'no message' })
  }

  const phone = message.from
  const text = message.text?.body?.trim() ?? ''
  const buttonPayload = message.interactive?.button_reply?.id ?? ''
  const listPayload = message.interactive?.list_reply?.id ?? ''
  const interactivePayload = buttonPayload || listPayload

  try {
    // Encontra o perfil pelo telefone
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, accounts(*)')
      .eq('whatsapp_phone', phone)
      .single()

    if (!profile) {
      await sendWhatsAppMessage(phone, 'Seu número não está vinculado a nenhuma conta. Configure pelo site.')
      return NextResponse.json({ status: 'unlinked' })
    }

    // Busca ou cria sessão
    let { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('profile_id', profile.id)
      .neq('state', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!session || isSessionExpired(session.last_message_at)) {
      // Nova sessão - interpreta mensagem como "nome valor"
      const parsed = parseTransaction(text)
      if (!parsed) {
        await sendWhatsAppMessage(phone,
          'Envie no formato: *nome valor*\nExemplo: _Mercado 120_\n\nOu envie *resumo* para ver o resumo do mês.')
        return NextResponse.json({ status: 'help' })
      }

      if (parsed.command === 'resumo') {
        return await handleResume(phone, profile)
      }

      // Cria sessão com dados temporários
      const { data: newSession } = await supabase
        .from('whatsapp_sessions')
        .insert({
          profile_id: profile.id,
          phone,
          state: 'awaiting_type',
          temp_data: { description: parsed.description, amount: parsed.amount },
        })
        .select()
        .single()
      session = newSession

      await sendWhatsAppButtons(phone,
        `*${parsed.description}* - R$ ${parsed.amount.toFixed(2)}\n\nÉ entrada ou saída?`,
        [
          { id: 'type_expense', title: 'Saída (Gasto)' },
          { id: 'type_income', title: 'Entrada (Receita)' },
          { id: 'cancel', title: 'Cancelar' },
        ]
      )
      return NextResponse.json({ status: 'awaiting_type' })
    }

    // Processa estado da sessão
    switch (session.state) {
      case 'awaiting_type':
        return await handleAwaitingType(phone, session, interactivePayload, profile)
      case 'awaiting_payment':
        return await handleAwaitingPayment(phone, session, interactivePayload, profile)
      case 'awaiting_category':
        return await handleAwaitingCategory(phone, session, interactivePayload, profile)
      case 'awaiting_confirm':
        return await handleAwaitingConfirm(phone, session, interactivePayload, profile)
      default:
        await completeSession(session.id)
        await sendWhatsAppMessage(phone, 'Sessão reiniciada. Envie uma nova transação.')
        return NextResponse.json({ status: 'reset' })
    }
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- Handlers por estado ---

async function handleAwaitingType(phone: string, session: any, payload: string, profile: any) {
  if (payload === 'cancel') {
    await completeSession(session.id)
    await sendWhatsAppMessage(phone, 'Cancelado.')
    return NextResponse.json({ status: 'cancelled' })
  }

  const type = payload === 'type_income' ? 'income' : 'expense'
  await updateSession(session.id, 'awaiting_payment', { ...session.temp_data, type })

  // Busca métodos de pagamento
  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, name, icon')
    .eq('account_id', profile.account_id)
    .eq('active', true)
    .limit(10)

  const buttons = (methods ?? []).slice(0, 3).map(m => ({
    id: `pm_${m.id}`,
    title: `${m.icon} ${m.name}`.slice(0, 20),
  }))

  await sendWhatsAppButtons(phone, 'Qual método de pagamento?', buttons)
  return NextResponse.json({ status: 'awaiting_payment' })
}

async function handleAwaitingPayment(phone: string, session: any, payload: string, profile: any) {
  const pmId = payload.replace('pm_', '')
  await updateSession(session.id, 'awaiting_category', { ...session.temp_data, payment_method_id: pmId })

  // Busca categorias
  const categoryType = session.temp_data.type === 'income' ? 'income' : 'expense'
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('type', [categoryType, 'both'])
    .limit(10)

  const rows = (categories ?? []).map(c => ({
    id: `cat_${c.id}`,
    title: `${c.icon} ${c.name}`.slice(0, 24),
  }))

  await sendWhatsAppList(phone, 'Selecione a categoria:', 'Categorias', rows)
  return NextResponse.json({ status: 'awaiting_category' })
}

async function handleAwaitingCategory(phone: string, session: any, payload: string, profile: any) {
  const catId = payload.replace('cat_', '')
  const data = { ...session.temp_data, category_id: catId }
  await updateSession(session.id, 'awaiting_confirm', data)

  // Busca nome da categoria
  const { data: cat } = await supabase.from('categories').select('name, icon').eq('id', catId).single()

  const typeLabel = data.type === 'income' ? 'Entrada' : 'Saída'
  const summary = [
    `*Confirmar transação:*`,
    `${typeLabel}: *${data.description}*`,
    `Valor: *R$ ${data.amount.toFixed(2)}*`,
    `Categoria: ${cat?.icon ?? ''} ${cat?.name ?? 'Outros'}`,
  ].join('\n')

  await sendWhatsAppButtons(phone, summary, [
    { id: 'confirm_yes', title: 'Confirmar' },
    { id: 'confirm_no', title: 'Cancelar' },
  ])
  return NextResponse.json({ status: 'awaiting_confirm' })
}

async function handleAwaitingConfirm(phone: string, session: any, payload: string, profile: any) {
  if (payload === 'confirm_no') {
    await completeSession(session.id)
    await sendWhatsAppMessage(phone, 'Cancelado.')
    return NextResponse.json({ status: 'cancelled' })
  }

  const data = session.temp_data
  const now = new Date()
  const monthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await supabase.from('transactions').insert({
    account_id: profile.account_id,
    profile_id: profile.id,
    category_id: data.category_id || null,
    payment_method_id: data.payment_method_id || null,
    type: data.type,
    description: data.description,
    amount: data.amount,
    date: now.toISOString().slice(0, 10),
    month_ref: monthRef,
    source: 'whatsapp',
  })

  await completeSession(session.id)
  await sendWhatsAppMessage(phone,
    `Salvo! ${data.type === 'income' ? '📥' : '📤'} *${data.description}* - R$ ${data.amount.toFixed(2)}`)
  return NextResponse.json({ status: 'saved' })
}

async function handleResume(phone: string, profile: any) {
  const monthRef = new Date().toISOString().slice(0, 7)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('account_id', profile.account_id)
    .eq('month_ref', monthRef)

  const income = (transactions ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = (transactions ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const msg = [
    `*Resumo do mês:*`,
    `📥 Entradas: R$ ${income.toFixed(2)}`,
    `📤 Saídas: R$ ${expenses.toFixed(2)}`,
    `💰 Saldo: R$ ${(income - expenses).toFixed(2)}`,
    `📊 ${(transactions ?? []).length} transações`,
  ].join('\n')

  await sendWhatsAppMessage(phone, msg)
  return NextResponse.json({ status: 'resume' })
}

// --- Helpers ---

function parseTransaction(text: string): { description: string; amount: number; command?: string } | null {
  if (text.toLowerCase() === 'resumo') return { description: '', amount: 0, command: 'resumo' }

  // "Mercado 120" ou "Almoço 45.50"
  const match = text.match(/^(.+?)\s+([\d.,]+)$/)
  if (!match) return null

  const description = match[1].trim()
  const amount = parseFloat(match[2].replace(',', '.'))
  if (!description || isNaN(amount) || amount <= 0) return null

  return { description, amount }
}

function isSessionExpired(lastMessageAt: string): boolean {
  const diff = Date.now() - new Date(lastMessageAt).getTime()
  return diff > 10 * 60 * 1000 // 10 minutos
}

async function updateSession(id: string, state: string, temp_data: any) {
  await supabase
    .from('whatsapp_sessions')
    .update({ state, temp_data, last_message_at: new Date().toISOString() })
    .eq('id', id)
}

async function completeSession(id: string) {
  await supabase
    .from('whatsapp_sessions')
    .update({ state: 'completed', last_message_at: new Date().toISOString() })
    .eq('id', id)
}

// --- WhatsApp Cloud API ---

async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return

  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
}

async function sendWhatsAppButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return

  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  })
}

async function sendWhatsAppList(to: string, bodyText: string, buttonTitle: string, rows: { id: string; title: string }[]) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return

  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonTitle,
          sections: [{ title: 'Opções', rows }],
        },
      },
    }),
  })
}
