'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import {
  getRecurringTransactions, createRecurringTransaction, deleteRecurringTransaction,
  getCategories, getPaymentMethods, getProfiles,
} from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { FREQUENCY_OPTIONS } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import type { RecurringTransaction, Category, PaymentMethod, Profile, Frequency, TransactionType } from '@/types'

export default function RecorrentesPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')

  const [form, setForm] = useState({
    type: 'expense' as TransactionType,
    description: '', amount: '', frequency: 'monthly' as Frequency,
    day_of_month: '10', category_id: '', payment_method_id: '', profile_id: '', notes: '',
  })

  async function load() {
    setLoading(true)
    const [recs, cats, pms, profs] = await Promise.all([
      getRecurringTransactions(), getCategories(), getPaymentMethods(), getProfiles(),
    ])
    setItems(recs); setCategories(cats); setPaymentMethods(pms); setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const account = profiles[0]?.account_id
    if (!account) return
    await createRecurringTransaction({
      account_id: account,
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      day_of_month: parseInt(form.day_of_month),
      category_id: form.category_id || undefined,
      payment_method_id: form.payment_method_id || undefined,
      profile_id: form.profile_id,
      notes: form.notes || undefined,
      active: true,
    } as any)
    setForm(f => ({ ...f, description: '', amount: '', notes: '' }))
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar esta recorrência?')) return
    await deleteRecurringTransaction(id)
    load()
  }

  const filtered = filterType === 'all' ? items : items.filter(i => i.type === filterType)
  const totalExpense = items.filter(i => i.type === 'expense').reduce((s, i) => s + Number(i.amount), 0)
  const totalIncome = items.filter(i => i.type === 'income').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-[220px] lg:ml-[264px] pb-24 md:pb-6">
        <div className="p-4 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-fg">Recorrentes</h1>
              <p className="text-fg-secondary text-sm">
                Despesas: {formatCurrency(totalExpense)} • Receitas: {formatCurrency(totalIncome)}
              </p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
              <Plus size={16} /> Nova
            </button>
          </div>

          {/* Filters */}
          <div className="filter-tabs">
            {(['all', 'expense', 'income'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`filter-tab ${filterType === f ? 'filter-tab-active' : ''}`}>
                {f === 'all' ? 'Todas' : f === 'expense' ? 'Despesas' : 'Receitas'}
              </button>
            ))}
          </div>

          {showForm && (
            <div className="card border-brand-200">
              <h2 className="text-sm font-semibold text-fg mb-4">Nova recorrência</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                {/* Type toggle */}
                <div className="col-span-2 flex gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.type === 'expense' ? 'bg-red-600 border-red-500 text-white' : 'bg-surface-input border border-surface-border text-fg-secondary hover:bg-surface-hover'
                    }`}
                  >📤 Despesa</button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.type === 'income' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-surface-input border border-surface-border text-fg-secondary hover:bg-surface-hover'
                    }`}
                  >📥 Receita</button>
                </div>
                <div className="col-span-2">
                  <label className="label">Descrição</label>
                  <input className="input" placeholder="Ex: Netflix, Aluguel..." required
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" required
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Frequência</label>
                  <select className="input" value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Frequency }))}>
                    {FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Dia do mês</label>
                  <input className="input" type="number" min="1" max="31" required
                    value={form.day_of_month} onChange={e => setForm(f => ({ ...f, day_of_month: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categories.filter(c => c.type === form.type || c.type === 'both').map(c =>
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="label">Pagamento</label>
                  <select className="input" value={form.payment_method_id}
                    onChange={e => setForm(f => ({ ...f, payment_method_id: e.target.value }))}>
                    <option value="">Não informado</option>
                    {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Responsável</label>
                  <select className="input" value={form.profile_id} required
                    onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar</button>
                </div>
              </form>
            </div>
          )}

          {loading ? <Loading /> : filtered.length === 0 ? (
            <EmptyState icon="🔄" title="Nenhuma recorrência" description="Adicione contas fixas, assinaturas e receitas recorrentes" />
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <div key={item.id} className="card flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${item.type === 'income' ? 'bg-brand-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{item.description}</p>
                    <p className="text-xs text-fg-secondary">
                      {item.categories?.icon} {item.categories?.name ?? 'Sem categoria'}
                      {` • ${item.profiles?.name}`}
                      {` • dia ${item.day_of_month}`}
                      {` • ${FREQUENCY_OPTIONS.find(o => o.value === item.frequency)?.label}`}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${item.type === 'income' ? 'text-brand-500' : 'text-red-500'}`}>
                    {formatCurrency(item.amount)}
                  </p>
                  <button onClick={() => handleDelete(item.id)} className="text-fg-muted hover:text-red-500">
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
