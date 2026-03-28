import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const month = new Date().toISOString().slice(0, 7)

  try {
    // 1. Gerar transações recorrentes
    const { data: recurringResult, error: recurringError } = await supabase
      .rpc('generate_recurring_for_month', { target_month: month })
    if (recurringError) throw recurringError

    // 2. Gerar income entries dos salary_schedule
    const { data: profiles } = await supabase.from('profiles').select('*')
    let incomeCount = 0

    for (const profile of profiles ?? []) {
      if (!profile.salary_schedule?.length || !profile.account_id) continue

      for (const entry of profile.salary_schedule as { label: string; amount: number; day: number }[]) {
        if (!entry.amount || entry.amount <= 0) continue

        const year = parseInt(month.split('-')[0])
        const monthNum = parseInt(month.split('-')[1])
        const lastDay = new Date(year, monthNum, 0).getDate()
        const day = Math.min(entry.day, lastDay)
        const date = `${month}-${String(day).padStart(2, '0')}`

        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('profile_id', profile.id)
          .eq('month_ref', month)
          .eq('description', entry.label)
          .eq('source', 'recurring')
          .eq('type', 'income')
          .limit(1)

        if (!existing?.length) {
          await supabase.from('transactions').insert({
            account_id: profile.account_id,
            profile_id: profile.id,
            type: 'income',
            description: entry.label,
            amount: entry.amount,
            date,
            month_ref: month,
            source: 'recurring',
            is_recurring: true,
          })
          incomeCount++
        }
      }
    }

    // 3. Verificar alertas de orçamento
    const { data: budgetResult } = await supabase.rpc('check_budget_alerts')

    return NextResponse.json({
      success: true,
      month,
      recurring: recurringResult,
      income_generated: incomeCount,
      budget_alerts: budgetResult,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
