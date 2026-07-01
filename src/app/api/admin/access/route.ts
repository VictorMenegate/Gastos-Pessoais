import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// cliente com service_role (ignora RLS) para operações administrativas
function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// confirma que quem chama é um admin aprovado
async function ensureAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: isAdmin } = await supabase.rpc('is_admin')
  return isAdmin === true
}

// GET: lista os pedidos de acesso (pendentes e aprovados)
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const { data, error } = await adminDb()
    .from('access_requests')
    .select('user_id, email, approved, is_admin, created_at')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

// POST: aprova (ou revoga) um usuário  { user_id, approved }
export async function POST(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const { user_id, approved } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })

  const { error } = await adminDb()
    .from('access_requests')
    .update({ approved: approved !== false })
    .eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
