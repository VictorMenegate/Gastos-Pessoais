'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { getExpenses, createExpense, deleteExpense, getCategories, getProfiles } from '@/lib/queries'
import MonthSelector from '@/components/MonthSelector'
import type { Expense, Category, Profile } from '@/types'
import Sidebar from '@/components/Sidebar'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function GastosPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    profile_id: '',
    paid: true,
    notes: '',
  })

  async function load(m: string) {
    setLoading(true)
    const [exp, cats, profs] = await Promise.all([
      getExpenses(m),
      getCategories(),
      getProfiles(),
    ])
    setExpenses(exp)
    setCategories(cats)
    setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createExpense({
      ...form,
      amount: parseFloat(form.amount),
      month_ref: month,
    } as any)
    setForm(f => ({ ...f, description: '', amount: '', notes: '' }))
    setShowForm(false)
    load(month)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este gasto?')) return
    await deleteExpense(id)
    load(month)
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gastos</h1>
              <p className="text-slate-400 text-sm">Total: {fmt(total)}</p>
            </div>
            <div className="flex items-center gap-3">
              <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
                <Plus size={16} /> Novo
              </button>
            </div>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="card border-green-800">
              <h2 className="text-sm font-semibold text-white mb-4">Novo gasto</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Descrição</label>
                  <input className="input" placeholder="Ex: Almoço, Uber..." required
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="0,00" required
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Data</label>
                  <input className="input" type="date" required
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">— Sem categoria —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Quem pagou</label>
                  <select className="input" value={form.profile_id} required
                    onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Observação (opcional)</label>
                  <input className="input" placeholder="..."
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar</button>
                </div>
              </form>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-500" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="card text-center py-10 text-slate-500">
              Nenhum gasto em {month}
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map(expense => (
                <div key={expense.id} className="card flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">
                    {expense.categories?.icon ?? '💸'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      {expense.categories?.name ?? 'Sem categoria'} • {expense.profiles?.name} • {expense.date}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-400 flex-shrink-0">{fmt(expense.amount)}</p>
                  <button onClick={() => handleDelete(expense.id)}
                    className="text-slate-500 hover:text-red-400 flex-shrink-0">
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
