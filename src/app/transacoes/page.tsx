'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Search, Sparkles } from 'lucide-react'
import { getTransactions, createTransaction, deleteTransaction, getProfiles } from '@/lib/queries'
import { formatCurrency, formatDate, monthRefFromDate } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionForm from '@/components/TransactionForm'
import ExtratoUpload from '@/components/ExtratoUpload'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import BottomSheet from '@/components/BottomSheet'
import ListRow from '@/components/ListRow'
import EmptyState from '@/components/EmptyState'
import { SkeletonList } from '@/components/Skeleton'
import { useStaggerIn } from '@/lib/useAnime'
import { useMediaQuery } from '@/lib/useMediaQuery'
import type { Transaction, TransactionFormData, TransactionType, Profile } from '@/types'

export default function TransacoesPage() {
  return (
    <Suspense>
      <TransacoesContent />
    </Suspense>
  )
}

function TransacoesContent() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showExtrato, setShowExtrato] = useState(false)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const actionHandled = useRef(false)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const listRef = useStaggerIn([loading, filterType])

  useEffect(() => {
    if (actionHandled.current) return
    const action = searchParams.get('action')
    if (action === 'gasto' || action === 'entrada') {
      setShowForm(true)
      setShowExtrato(false)
      actionHandled.current = true
    } else if (action === 'extrato') {
      setShowExtrato(true)
      setShowForm(false)
      actionHandled.current = true
    }
  }, [searchParams])

  async function load(m: string) {
    setLoading(true)
    const [txs, profs] = await Promise.all([getTransactions(m), getProfiles()])
    setTransactions(txs)
    setProfiles(profs)
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  async function handleSubmit(data: TransactionFormData) {
    const account = profiles[0]?.account_id
    if (!account) return
    await createTransaction({
      account_id: account,
      type: data.type,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      month_ref: monthRefFromDate(data.date),
      category_id: data.category_id || undefined,
      payment_method_id: data.payment_method_id || undefined,
      profile_id: data.profile_id,
      notes: data.notes || undefined,
      tags: data.tags,
      source: 'manual',
    } as any)
    setShowForm(false)
    load(month)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return
    await deleteTransaction(id)
    load(month)
  }

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <PageShell
      hero={
        <PageHero
          title="Transações"
          subtitle={
            <>
              <span className="text-emerald-200 font-semibold">+{formatCurrency(totalIncome)}</span>
              <span className="mx-1.5 text-white/40">·</span>
              <span className="text-red-200 font-semibold">−{formatCurrency(totalExpense)}</span>
            </>
          }
          value={loading ? '—' : formatCurrency(totalIncome - totalExpense)}
          valueLabel="saldo do período"
          loading={loading}
          actions={<MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} variant="dark" compact />}
          pills={
            <>
              <button data-anim="pill" onClick={() => { setShowForm(true); setShowExtrato(false) }}
                className="pill-btn flex-1 max-w-[170px] opacity-0">
                <Plus size={16} /> Nova
              </button>
              <button data-anim="pill" onClick={() => { setShowExtrato(true); setShowForm(false) }}
                className="pill-btn flex-1 max-w-[170px] opacity-0">
                <Sparkles size={16} /> Extrato IA
              </button>
            </>
          }
        />
      }
    >
      {/* Header desktop (mobile usa o hero) */}
      <div className="hidden md:block space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-fg">Transações</h1>
            <p className="text-fg-secondary text-sm">
              <span className="text-brand-500">+{formatCurrency(totalIncome)}</span>
              {' / '}
              <span className="text-red-500">-{formatCurrency(totalExpense)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} compact />
            <button onClick={() => { setShowExtrato(!showExtrato); setShowForm(false) }}
              className="btn-secondary flex items-center gap-1.5">
              <Sparkles size={16} /> Extrato IA
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowExtrato(false) }}
              className="btn-primary flex items-center gap-1.5">
              <Plus size={16} /> Nova transação
            </button>
          </div>
        </div>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="filter-tabs">
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`filter-tab ${filterType === f ? 'filter-tab-active' : ''}`}>
              {f === 'all' ? 'Todas' : f === 'expense' ? 'Saídas' : 'Entradas'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Extrato IA — sheet no mobile, card inline no desktop */}
      <BottomSheet open={showExtrato} onClose={() => setShowExtrato(false)} title="✨ Extrato IA" desktopMode="bare">
        <ExtratoUpload
          bare={isMobile}
          onClose={() => setShowExtrato(false)}
          onSaved={mesRef => {
            // Navega até o mês do extrato para as transações importadas aparecerem
            if (mesRef && mesRef !== month) setMonth(mesRef)
            else load(month)
          }}
        />
      </BottomSheet>

      {/* Nova transação — sheet no mobile, card inline no desktop */}
      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Nova transação" desktopMode="bare">
        <TransactionForm
          bare={isMobile}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      </BottomSheet>

      {/* Lista */}
      {loading ? <SkeletonList rows={6} /> : filtered.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Nenhuma transação encontrada"
          description={searchQuery ? 'Tente outro termo de busca' : `Nenhuma transação em ${month}`}
        />
      ) : (
        <div ref={listRef} className="space-y-2">
          {filtered.map(t => (
            <ListRow
              key={t.id}
              icon={t.categories?.icon ?? '💸'}
              iconBg={t.type === 'income' ? 'rgba(var(--accent-rgb), 0.08)' : 'rgba(239, 68, 68, 0.07)'}
              title={
                <span className="inline-flex items-center gap-2">
                  {t.description}
                  {t.source !== 'manual' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-surface-input text-fg-muted">
                      {t.source === 'whatsapp' ? '📱' : t.source === 'recurring' ? '🔄' : '🏦'}
                    </span>
                  )}
                </span>
              }
              meta={
                <>
                  {t.categories?.name ?? 'Sem categoria'}
                  {t.payment_methods && ` • ${t.payment_methods.icon} ${t.payment_methods.name}`}
                  {` • ${t.profiles?.name}`}
                  {` • ${formatDate(t.date)}`}
                </>
              }
              right={
                <span className={t.type === 'income' ? 'text-brand-500' : 'text-red-500'}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              }
              rightSub={t.type === 'income' ? 'Entrada' : 'Gasto'}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
