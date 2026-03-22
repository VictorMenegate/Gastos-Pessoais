'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import {
  getRecurringBills, createRecurringBill, deleteRecurringBill,
  getBillOccurrences, toggleBillPaid, getCategories, getProfiles
} from '@/lib/queries'
import MonthSelector from '@/components/MonthSelector'
import Sidebar from '@/components/Sidebar'
import type { Category, Profile } from '@/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function ContasPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [bills, setBills] = useState<any[]>([])
  const [occurrences, setOccurrences] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'month' | 'manage'>('month')

  const [form, setForm] = useState({
    description: '', amount: '', due_day: '10',
    category_id: '', profile_id: '', notes: '',
  })

  async function load(m: string) {
    setLoading(true)
    const [rb, occ, cats, profs] = await Promise.all([
      getRecurringBills(), getBillOccurrences(m), getCategories(), getProfiles(),
    ])
    setBills(rb); setOccurrences(occ); setCategories(cats); setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createRecurringBill({
      ...form,
      amount: parseFloat(form.amount),
      due_day: parseInt(form.due_day),
      active: true,
    } as any)
    setForm(f => ({ ...f, description: '', amount: '', notes: '' }))
    setShowForm(false)
    load(month)
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar esta conta recorrente?')) return
    await deleteRecurringBill(id)
    load(month)
  }

  async function handleToggle(id: string, paid: boolean) {
    await toggleBillPaid(id, !paid)
    load(month)
  }

  const today = new Date()
  const totalPaid = occurrences.filter(o => o.paid).reduce((s, o) => s + Number(o.amount), 0)
  const totalPending = occurrences.filter(o => !o.paid).reduce((s, o) => s + Number(o.amount), 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">Contas Recorrentes</h1>
              <p className="text-slate-400 text-sm">
                Pagas: {fmt(totalPaid)} • Pendentes: {fmt(totalPending)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
                <Plus size={16} /> Nova conta
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            <button onClick={() => setTab('month')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'month' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              Este mês
            </button>
            <button onClick={() => setTab('manage')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'manage' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              Gerenciar
            </button>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="card border-green-800">
              <h2 className="text-sm font-semibold text-white mb-4">Nova conta recorrente</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Descrição</label>
                  <input className="input" placeholder="Ex: Conta de luz, Netflix..." required
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="0,00" required
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Dia de vencimento</label>
                  <input className="input" type="number" min="1" max="31" required
                    value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">— Sem categoria —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-500" />
            </div>
          ) : tab === 'month' ? (
            /* Ocorrências do mês */
            <div className="space-y-2">
              {occurrences.length === 0 ? (
                <div className="card text-center py-10 text-slate-500">
                  Nenhuma conta para {month}.<br />
                  <span className="text-xs">O cron gera automaticamente no dia 1 de cada mês.</span>
                </div>
              ) : (
                occurrences.map(occ => {
                  const due = new Date(occ.due_date)
                  const overdue = !occ.paid && due < today
                  const rb = occ.recurring_bills
                  return (
                    <div key={occ.id}
                      className={`card flex items-center gap-3 cursor-pointer ${occ.paid ? 'opacity-60' : overdue ? 'border-red-800' : ''}`}
                      onClick={() => handleToggle(occ.id, occ.paid)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${occ.paid ? 'border-green-500 bg-green-500' : overdue ? 'border-red-500' : 'border-slate-500'}`}>
                        {occ.paid && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${occ.paid ? 'line-through text-slate-400' : 'text-white'}`}>
                          {rb?.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {rb?.categories?.icon} {rb?.categories?.name} • {rb?.profiles?.name} • dia {occ.due_date.slice(8, 10)}
                          {overdue && ' ⚠ Atrasada'}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${occ.paid ? 'text-green-400' : overdue ? 'text-red-400' : 'text-white'}`}>
                        {fmt(occ.amount)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* Gerenciar contas recorrentes */
            <div className="space-y-2">
              {bills.length === 0 ? (
                <div className="card text-center py-10 text-slate-500">Nenhuma conta recorrente cadastrada</div>
              ) : (
                bills.map(bill => (
                  <div key={bill.id} className="card flex items-center gap-3">
                    <RefreshCw size={16} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{bill.description}</p>
                      <p className="text-xs text-slate-400">
                        {bill.categories?.icon} {bill.categories?.name} • {bill.profiles?.name} • todo dia {bill.due_day}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">{fmt(bill.amount)}</p>
                    <button onClick={() => handleDelete(bill.id)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
