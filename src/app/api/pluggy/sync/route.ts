import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const PLUGGY_API = 'https://api.pluggy.ai'
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID!
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET!

async function getApiKey() {
  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  })
  const data = await res.json()
  return data.apiKey
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const profileId = searchParams.get('profileId')

  if (!itemId || !profileId) {
    return NextResponse.json({ error: 'itemId and profileId required' }, { status: 400 })
  }

  try {
    const apiKey = await getApiKey()

    // Busca contas do item
    const accountsRes = await fetch(`${PLUGGY_API}/accounts?itemId=${itemId}`, {
      headers: { 'X-API-KEY': apiKey },
    })
    const accountsData = await accountsRes.json()
    const accounts = accountsData.results || []

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const allTransactions: any[] = []
    let imported = 0

    for (const account of accounts) {
      // Busca transações dos últimos 90 dias
      const from = format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const txRes = await fetch(
        `${PLUGGY_API}/transactions?accountId=${account.id}&from=${from}&pageSize=100`,
        { headers: { 'X-API-KEY': apiKey } }
      )
      const txData = await txRes.json()
      const txs = txData.results || []
      allTransactions.push(...txs)

      for (const tx of txs) {
        const monthRef = tx.date.slice(0, 7) // "2024-12"
        const amount = Math.abs(tx.amount)
        const isCredit = tx.type === 'CREDIT'

        if (isCredit) {
          // Entrada de dinheiro
          await supabase.from('income_entries').upsert({
            profile_id: profileId,
            label: tx.description || 'Transferência recebida',
            amount,
            expected_date: tx.date,
            received_date: tx.date,
            month_ref: monthRef,
            notes: `Importado do banco · ID: ${tx.id}`,
          }, { onConflict: 'profile_id,label,month_ref', ignoreDuplicates: true })
        } else {
          // Gasto
          const { error } = await supabase.from('expenses').upsert({
            profile_id: profileId,
            description: tx.description || 'Gasto importado',
            amount,
            date: tx.date,
            month_ref: monthRef,
            paid: true,
            notes: `Importado do banco · ID: ${tx.id}`,
          }, { onConflict: 'profile_id,description,date', ignoreDuplicates: true })

          if (!error) imported++
        }
      }
    }

    return NextResponse.json({
      transactions: allTransactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        date: tx.date,
        type: tx.type,
      })),
      imported,
      accounts: accounts.length,
    })
  } catch (err) {
    console.error('Pluggy sync error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
