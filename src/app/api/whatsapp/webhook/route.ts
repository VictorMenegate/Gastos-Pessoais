import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Evolution API (gateway WhatsApp self-hosted)
const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || '').replace(/\/+$/, '')
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

// Health check (Evolution não usa verificação por challenge como a Meta)
export async function GET() {
  return NextResponse.json({ status: 'ok', provider: 'evolution' })
}

// Webhook - recebe mensagens da Evolution API
export async function POST(request: Request) {
  const body = await request.json()

  // Evolution envia vários eventos; só nos interessa mensagem recebida
  if (body.event && body.event !== 'messages.upsert') {
    return NextResponse.json({ status: 'ignored', event: body.event })
  }

  // data pode vir como objeto único ou array (varia por versão)
  const data = Array.isArray(body.data) ? body.data[0] : body.data
  const key = data?.key

  // Ignora mensagens enviadas por nós mesmos, status e grupos
  if (!key || key.fromMe) {
    return NextResponse.json({ status: 'ignored' })
  }
  const remoteJid: string = key.remoteJid || ''
  if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') {
    return NextResponse.json({ status: 'ignored', reason: 'group/status' })
  }

  const phone = remoteJid.split('@')[0] // número do remetente (ex: 5511999999999)

  // Extrai texto da mensagem (texto, botão clicado, ou item de lista)
  const m = data?.message ?? {}
  const text: string =
    m.buttonsResponseMessage?.selectedButtonId ??
    m.listResponseMessage?.singleSelectReply?.selectedRowId ??
    m.templateButtonReplyMessage?.selectedId ??
    m.extendedTextMessage?.text ??
    m.conversation ??
    ''

  if (!phone || !text.trim()) {
    return NextResponse.json({ status: 'no content' })
  }

  // Marca mensagem como lida
  await markAsRead(key)

  try {
    // Encontra perfil pelo telefone (busca flexível por diferentes formatos)
    const profile = await findProfileByPhone(phone)

    if (!profile) {
      await sendMessage(phone, 'Seu numero nao esta vinculado a nenhuma conta. Configure pelo site.')
      return NextResponse.json({ status: 'unlinked', phone })
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
          { id: 'type_expense', title: '📤 Saída (Gasto)' },
          { id: 'type_income', title: '📥 Entrada (Receita)' },
          { id: 'cancel', title: '❌ Cancelar' },
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

  await sendButtons(phone, '💳 *Como foi o pagamento?*', [
    { id: 'pm_pix', title: '⚡ Pix' },
    { id: 'pm_debito', title: '💳 Débito' },
    { id: 'pm_credito', title: '💳 Crédito' },
  ])
  return NextResponse.json({ status: 'awaiting_payment' })
}

const PAYMENT_OPTIONS: Record<string, string> = {
  'pm_pix': 'pix', 'pm_debito': 'debit', 'pm_credito': 'credit',
  '1': 'pix', '2': 'debit', '3': 'credit',
}

async function handleAwaitingPayment(phone: string, session: any, input: string, profile: any) {
  const paymentType = PAYMENT_OPTIONS[input.toLowerCase()] || 'pix'

  // Busca o payment_method correspondente no banco
  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, type')
    .eq('account_id', profile.account_id)
    .eq('type', paymentType)
    .limit(1)

  const pmId = methods?.[0]?.id || null

  await updateSession(session.id, 'awaiting_category', { ...session.temp_data, payment_method_id: pmId, payment_type: paymentType })
  return await sendCategoryOptions(phone, session.temp_data.type === 'income' ? 'income' : 'expense')
}

async function sendCategoryOptions(phone: string, type: string) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('type', [type, 'both'])
    .limit(10)

  await sendList(phone, '📁 *Categoria:*', 'Escolher', (categories ?? []).map((c, i) => ({
    id: `cat_${i}`,
    title: `${c.icon} ${c.name}`.slice(0, 24),
  })))
  return NextResponse.json({ status: 'awaiting_category' })
}

async function handleAwaitingCategory(phone: string, session: any, input: string, profile: any) {
  const categoryType = session.temp_data.type === 'income' ? 'income' : 'expense'
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('type', [categoryType, 'both'])
    .limit(10)

  // Suporta tanto número quanto id do botão (cat_0, cat_1...)
  const idx = input.startsWith('cat_') ? parseInt(input.replace('cat_', '')) : parseInt(input) - 1
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
  ].join('\n')

  await sendButtons(phone, summary, [
    { id: 'confirm_yes', title: 'Sim, salvar' },
    { id: 'confirm_no', title: 'Cancelar' },
  ])
  return NextResponse.json({ status: 'awaiting_confirm' })
}

async function handleAwaitingConfirm(phone: string, session: any, input: string, profile: any) {
  const lower = input.toLowerCase()
  if (lower === 'nao' || lower === 'não' || lower === 'n' || lower === '2' || lower === 'confirm_no') {
    await completeSession(session.id)
    await sendMessage(phone, '❌ Cancelado.')
    return NextResponse.json({ status: 'cancelled' })
  }

  if (lower !== 'sim' && lower !== 's' && lower !== '1' && lower !== 'ok' && lower !== 'confirm_yes') {
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

// Normaliza telefone: remove caracteres especiais e garante formato 55 + DDD + número
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Se já tem DDI 55, retorna como está
  if (digits.length >= 12 && digits.startsWith('55')) return digits
  // Se tem 10-11 dígitos (DDD + número), adiciona DDI 55
  if (digits.length >= 10 && digits.length <= 11) return '55' + digits
  return digits
}

async function findProfileByPhone(phone: string): Promise<any | null> {
  // Tenta match exato primeiro
  const { data: exact } = await supabase
    .from('profiles')
    .select('*')
    .eq('whatsapp_phone', phone)
    .limit(1)
  if (exact?.[0]) return exact[0]

  // Busca todos os perfis com whatsapp e compara normalizado
  const { data: all } = await supabase
    .from('profiles')
    .select('*')
    .not('whatsapp_phone', 'is', null)

  const normalized = normalizePhone(phone)
  return (all ?? []).find(p => normalizePhone(p.whatsapp_phone) === normalized) || null
}

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

// --- Evolution API ---
// Botões/listas interativos são instáveis no WhatsApp via Evolution, então
// renderizamos as opções como texto numerado (o fluxo já aceita resposta por número).

function evolutionConfigured() {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE)
}

async function evolutionPost(path: string, payload: Record<string, unknown>) {
  if (!evolutionConfigured()) return
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/${path}/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`Evolution ${path} error ${res.status}:`, await res.text().catch(() => ''))
    }
  } catch (e) {
    console.error(`Evolution ${path} fetch error:`, e)
  }
}

async function sendMessage(to: string, text: string) {
  // Evolution v2: POST /message/sendText/{instance} { number, text }
  await evolutionPost('message/sendText', { number: to, text })
}

async function sendButtons(to: string, text: string, buttons: { id: string; title: string }[]) {
  const body = text + '\n\n' +
    buttons.map((b, i) => `*${i + 1}.* ${b.title}`).join('\n') +
    '\n\n_Responda com o número da opção._'
  await sendMessage(to, body)
}

async function sendList(to: string, text: string, _buttonText: string, rows: { id: string; title: string }[]) {
  const body = text + '\n\n' +
    rows.map((r, i) => `*${i + 1}.* ${r.title}`).join('\n') +
    '\n\n_Responda com o número da opção._'
  await sendMessage(to, body)
}

async function markAsRead(key: { remoteJid?: string; fromMe?: boolean; id?: string }) {
  if (!evolutionConfigured() || !key?.id) return
  // Evolution v2: POST /chat/markMessageAsRead/{instance} { readMessages: [key] }
  await evolutionPost('chat/markMessageAsRead', {
    readMessages: [{ remoteJid: key.remoteJid, fromMe: key.fromMe ?? false, id: key.id }],
  })
}
