'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Pencil, Filter, Search } from 'lucide-react'
import { getTransactions, createTransaction, deleteTransaction, getProfiles } from '@/lib/queries'
import { formatCurrency, formatDate, currentMonthRef, monthRefFromDate } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import TransactionForm from '@/components/TransactionForm'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Sidebar from '@/components/Sidebar'
import type { Transaction, TransactionFormData, TransactionType, Profile } from '@/types'

export default function TransacoesPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-60 pb-24 md:pb-6">
        <div className="p-4 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
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
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
                <Plus size={16} /> Nova
              </button>
            </div>
          </div>

          {/* Filters */}
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

          {/* Form */}
          {showForm && (
            <TransactionForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* List */}
          {loading ? <Loading /> : filtered.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Nenhuma transação encontrada"
              description={searchQuery ? 'Tente outro termo de busca' : `Nenhuma transação em ${month}`}
            />
          ) : (
            <div className="space-y-2">
              {filtered.map(t => (
                <div key={t.id} className="card flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{t.categories?.icon ?? '💸'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-fg truncate">{t.description}</p>
                      {t.source !== 'manual' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-input text-fg-muted">
                          {t.source === 'whatsapp' ? '📱' : t.source === 'recurring' ? '🔄' : '🏦'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-secondary">
                      {t.categories?.name ?? 'Sem categoria'}
                      {t.payment_methods && ` • ${t.payment_methods.icon} ${t.payment_methods.name}`}
                      {` • ${t.profiles?.name}`}
                      {` • ${formatDate(t.date)}`}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${
                    t.type === 'income' ? 'text-brand-500' : 'text-red-500'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-fg-muted hover:text-red-500 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
