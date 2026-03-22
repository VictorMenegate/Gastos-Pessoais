import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  // Valida o secret do cron
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const month = format(new Date(), 'yyyy-MM')

  try {
    const { data, error } = await supabase.rpc('generate_monthly_occurrences', {
      target_month: month,
    })

    if (error) throw error

    // Também gera income_entries a partir dos salary_schedules
    const { data: profiles } = await supabase.from('profiles').select('*')

    for (const profile of profiles ?? []) {
      const schedule = profile.salary_schedule as { label: string; amount: number; day: number }[]
      for (const entry of schedule) {
        const day = Math.min(entry.day, 28)
        const expectedDate = `${month}-${String(day).padStart(2, '0')}`
        await supabase.from('income_entries').upsert(
          {
            profile_id: profile.id,
            label: entry.label,
            amount: entry.amount,
            expected_date: expectedDate,
            month_ref: month,
          },
          { onConflict: 'profile_id,label,month_ref', ignoreDuplicates: true }
        )
      }
    }

    return NextResponse.json({
      success: true,
      month,
      result: data,
    })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
