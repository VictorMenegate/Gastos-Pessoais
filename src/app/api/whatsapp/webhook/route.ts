import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL // ex: http://evolution:8080
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'gastos'

// Evolution API envia POST quando recebe mensagem
export async function POST(request: Request) {
  const body = await request.json()

  // Evolution API webhook format
  const event = body.event
  if (event !== 'messages.upsert') {
    return NextResponse.json({ status: 'ignored', event })
  }

  const msg = body.data
  if (!msg || msg.key?.fromMe) {
    return NextResponse.json({ status: 'ignored' })
  }

  // Extrai número e texto
  const remoteJid = msg.key?.remoteJid ?? ''
  const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
  const text = msg.message?.conversation
    ?? msg.message?.extendedTextMessage?.text
    ?? msg.message?.buttonsResponseMessage?.selectedButtonId
    ?? msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId
    ?? ''

  if (!phone || !text.trim()) {
    return NextResponse.json({ status: 'no content' })
  }

  try {
    // Encontra perfil pelo telefone
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('whatsapp_phone', phone)
      .limit(1)

    const profile = profiles?.[0]

    if (!profile || profileError) {
      await sendMessage(phone, 'Seu numero nao esta vinculado a nenhuma conta. Configure pelo site.')
      return NextResponse.json({ status: 'unlinked', phone, error: profileError?.message })
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
      // Limpa sessões antigas
      if (session) await completeSession(session.id)

      const parsed = parseTransaction(text.trim())
      if (!parsed) {
        await sendMessage(phone,
          '📊 *Gastos Pessoais*\n\nEnvie no formato:\n*nome valor*\n\nExemplos:\n_Mercado 120_\n_Almoço 35.50_\n_Uber 18_\n\nComandos:\n*resumo* - ver resumo do mês')
        return NextResponse.json({ status: 'help' })
      }

      if (parsed.command === 'resumo') {
        return await handleResume(phone, profile)
      }

      // Cria sessão
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

      await sendButtons(phone,
        `💰 *${parsed.description}* - R$ ${parsed.amount.toFixed(2)}\n\nÉ entrada ou saída?`,
        [
          { id: 'type_expense', text: '📤 Saída (Gasto)' },
          { id: 'type_income', text: '📥 Entrada (Receita)' },
          { id: 'cancel', text: '❌ Cancelar' },
        ]
      )
      return NextResponse.json({ status: 'awaiting_type' })
    }

    // Processa estado da sessão
    const input = text.trim()
    switch (session.state) {
      case 'awaiting_type':
        return await handleAwaitingType(phone, session, input, profile)
      case 'awaiting_payment':
        return await handleAwaitingPayment(phone, session, input, profile)
      case 'awaiting_category':
        return await handleAwaitingCategory(phone, session, input, profile)
      case 'awaiting_confirm':
        return await handleAwaitingConfirm(phone, session, input, profile)
      default:
        await completeSession(session.id)
        await sendMessage(phone, 'Sessão reiniciada. Envie uma nova transação.')
        return NextResponse.json({ status: 'reset' })
    }
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- Handlers ---

async function handleAwaitingType(phone: string, session: any, input: string, profile: any) {
  if (input.includes('cancel') || input === '3' || input.toLowerCase() === 'cancelar') {
    await completeSession(session.id)
    await sendMessage(phone, '❌ Cancelado.')
    return NextResponse.json({ status: 'cancelled' })
  }

  const isIncome = input.includes('income') || input.includes('entrada') || input === '2'
  const type = isIncome ? 'income' : 'expense'
  await updateSession(session.id, 'awaiting_payment', { ...session.temp_data, type })

  // Busca métodos de pagamento
  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, name, icon')
    .eq('account_id', profile.account_id)
    .eq('active', true)
    .limit(10)

  if (!methods?.length) {
    // Sem métodos, pula para categoria
    await updateSession(session.id, 'awaiting_category', { ...session.temp_data, type, payment_method_id: null })
    return await sendCategoryOptions(phone, session.temp_data.type === 'income' ? 'income' : 'expense')
  }

  const list = methods.map((m, i) => `*${i + 1}.* ${m.icon} ${m.name}`).join('\n')
  await sendMessage(phone, `💳 *Método de pagamento:*\n\n${list}\n\nResponda com o número`)
  return NextResponse.json({ status: 'awaiting_payment' })
}

async function handleAwaitingPayment(phone: string, session: any, input: string, profile: any) {
  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, name')
    .eq('account_id', profile.account_id)
    .eq('active', true)
    .limit(10)

  const idx = parseInt(input) - 1
  const method = methods?.[idx]
  const pmId = method?.id || null

  await updateSession(session.id, 'awaiting_category', { ...session.temp_data, payment_method_id: pmId })
  return await sendCategoryOptions(phone, session.temp_data.type === 'income' ? 'income' : 'expense')
}

async function sendCategoryOptions(phone: string, type: string) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('type', [type, 'both'])
    .limit(10)

  const list = (categories ?? []).map((c, i) => `*${i + 1}.* ${c.icon} ${c.name}`).join('\n')
  await sendMessage(phone, `📁 *Categoria:*\n\n${list}\n\nResponda com o número`)
  return NextResponse.json({ status: 'awaiting_category' })
}

async function handleAwaitingCategory(phone: string, session: any, input: string, profile: any) {
  const categoryType = session.temp_data.type === 'income' ? 'income' : 'expense'
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('type', [categoryType, 'both'])
    .limit(10)

  const idx = parseInt(input) - 1
  const cat = categories?.[idx]
  const data = { ...session.temp_data, category_id: cat?.id || null }
  await updateSession(session.id, 'awaiting_confirm', data)

  const typeEmoji = data.type === 'income' ? '📥' : '📤'
  const typeLabel = data.type === 'income' ? 'Entrada' : 'Saída'
  const summary = [
    `✅ *Confirmar transação:*\n`,
    `${typeEmoji} ${typeLabel}`,
    `📝 *${data.description}*`,
    `💰 *R$ ${data.amount.toFixed(2)}*`,
    `📁 ${cat?.icon ?? '📦'} ${cat?.name ?? 'Outros'}`,
    `\nResponda *sim* para confirmar ou *não* para cancelar`,
  ].join('\n')

  await sendMessage(phone, summary)
  return NextResponse.json({ status: 'awaiting_confirm' })
}

async function handleAwaitingConfirm(phone: string, session: any, input: string, profile: any) {
  const lower = input.toLowerCase()
  if (lower === 'nao' || lower === 'não' || lower === 'n' || lower === '2') {
    await completeSession(session.id)
    await sendMessage(phone, '❌ Cancelado.')
    return NextResponse.json({ status: 'cancelled' })
  }

  if (lower !== 'sim' && lower !== 's' && lower !== '1' && lower !== 'ok') {
    await sendMessage(phone, 'Responda *sim* ou *não*')
    return NextResponse.json({ status: 'awaiting_confirm' })
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
  const emoji = data.type === 'income' ? '📥' : '📤'
  await sendMessage(phone, `${emoji} *Salvo!* ${data.description} - R$ ${data.amount.toFixed(2)}\n\nEnvie outra transação ou digite *resumo*`)
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
  const balance = income - expenses

  const msg = [
    `📊 *Resumo do mês:*\n`,
    `📥 Entradas: R$ ${income.toFixed(2)}`,
    `📤 Saídas: R$ ${expenses.toFixed(2)}`,
    `${balance >= 0 ? '💚' : '🔴'} Saldo: R$ ${balance.toFixed(2)}`,
    `📋 ${(transactions ?? []).length} transações`,
  ].join('\n')

  await sendMessage(phone, msg)
  return NextResponse.json({ status: 'resume' })
}

// --- Helpers ---

function parseTransaction(text: string): { description: string; amount: number; command?: string } | null {
  const lower = text.toLowerCase()
  if (lower === 'resumo' || lower === 'saldo') return { description: '', amount: 0, command: 'resumo' }

  const match = text.match(/^(.+?)\s+([\d.,]+)$/)
  if (!match) return null

  const description = match[1].trim()
  const amount = parseFloat(match[2].replace(',', '.'))
  if (!description || isNaN(amount) || amount <= 0) return null

  return { description, amount }
}

function isSessionExpired(lastMessageAt: string): boolean {
  const diff = Date.now() - new Date(lastMessageAt).getTime()
  return diff > 10 * 60 * 1000
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

// --- Evolution API v1.8 ---

async function sendMessage(to: string, text: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return

  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: to,
        textMessage: { text },
      }),
    })
  } catch (e) {
    console.error('Evolution API send error:', e)
  }
}

async function sendButtons(to: string, text: string, buttons: { id: string; text: string }[]) {
  // Evolution v1.8 - envia como texto com opções numeradas
  const fallbackText = text + '\n\n' + buttons.map((b, i) => `*${i + 1}.* ${b.text}`).join('\n')
  await sendMessage(to, fallbackText)
}
