'use client'

import { useEffect, useState } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { getInstallments, createInstallment, markInstallmentPaid, getCategories, getProfiles } from '@/lib/queries'
import Sidebar from '@/components/Sidebar'
import type { Category, Profile } from '@/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function ParceladosPage() {
  const [installments, setInstallments] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    description: '', total_amount: '', installment_value: '',
    total_installments: '', start_date: new Date().toISOString().slice(0, 10),
    due_day: '10', category_id: '', profile_id: '', notes: '',
  })

  async function load() {
    setLoading(true)
    const [inst, cats, profs] = await Promise.all([
      getInstallments(), getCategories(), getProfiles(),
    ])
    setInstallments(inst); setCategories(cats); setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-calcula valor da parcela ao mudar total ou qtd
  function handleTotalOrQty(field: string, value: string) {
    const next = { ...form, [field]: value }
    if (next.total_amount && next.total_installments) {
      const calc = (parseFloat(next.total_amount) / parseInt(next.total_installments)).toFixed(2)
      setForm({ ...next, installment_value: calc })
    } else {
      setForm(next)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createInstallment({
      ...form,
      total_amount: parseFloat(form.total_amount),
      installment_value: parseFloat(form.installment_value),
      total_installments: parseInt(form.total_installments),
      due_day: parseInt(form.due_day),
      paid_installments: 0,
      active: true,
    } as any)
    setShowForm(false)
    load()
  }

  async function handleMarkPaid(id: string) {
    if (!confirm('Marcar próxima parcela como paga?')) return
    await markInstallmentPaid(id)
    load()
  }

  const totalMonthly = installments.reduce((s, i) => s + Number(i.installment_value), 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Parcelados</h1>
              <p className="text-slate-400 text-sm">Compromisso mensal: {fmt(totalMonthly)}</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
              <Plus size={16} /> Novo
            </button>
          </div>

          {showForm && (
            <div className="card border-green-800">
              <h2 className="text-sm font-semibold text-white mb-4">Novo parcelamento</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Descrição</label>
                  <input className="input" placeholder="Ex: TV Samsung, Geladeira..." required
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor total (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="0,00" required
                    value={form.total_amount} onChange={e => handleTotalOrQty('total_amount', e.target.value)} />
                </div>
                <div>
                  <label className="label">Nº de parcelas</label>
                  <input className="input" type="number" min="2" placeholder="12" required
                    value={form.total_installments} onChange={e => handleTotalOrQty('total_installments', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor por parcela (R$)</label>
                  <input className="input" type="number" step="0.01" required
                    value={form.installment_value} onChange={e => setForm(f => ({ ...f, installment_value: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Dia de vencimento</label>
                  <input className="input" type="number" min="1" max="31" required
                    value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Data início</label>
                  <input className="input" type="date" required
                    value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Responsável</label>
                  <select className="input" value={form.profile_id} required
                    onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">— Sem categoria —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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
          ) : installments.length === 0 ? (
            <div className="card text-center py-10 text-slate-500">Nenhum parcelamento ativo</div>
          ) : (
            <div className="space-y-3">
              {installments.map(inst => {
                const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                const remaining = inst.total_installments - inst.paid_installments
                return (
                  <div key={inst.id} className="card space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-slate-400" />
                          <p className="text-sm font-medium text-white">{inst.description}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {inst.categories?.icon} {inst.categories?.name} • {inst.profiles?.name} • dia {inst.due_day}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{fmt(inst.installment_value)}/mês</p>
                        <p className="text-xs text-slate-400">{remaining} restantes</p>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{inst.paid_installments}/{inst.total_installments} pagas</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Total: {fmt(inst.total_amount)} • Pago: {fmt(inst.paid_installments * inst.installment_value)}
                      </p>
                      <button onClick={() => handleMarkPaid(inst.id)} className="btn-secondary text-xs py-1">
                        Marcar parcela paga
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
