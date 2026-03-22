'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, CheckCircle2, Clock } from 'lucide-react'
import { getIncomeEntries, upsertIncomeEntry, markIncomeReceived, getProfiles } from '@/lib/queries'
import MonthSelector from '@/components/MonthSelector'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function EntradasPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [incomes, setIncomes] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    label: '', amount: '', expected_date: '',
    profile_id: '', notes: '',
  })

  async function load(m: string) {
    setLoading(true)
    const [inc, profs] = await Promise.all([getIncomeEntries(m), getProfiles()])
    setIncomes(inc); setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await upsertIncomeEntry({
      ...form,
      amount: parseFloat(form.amount),
      month_ref: month,
    } as any)
    setShowForm(false)
    setForm(f => ({ ...f, label: '', amount: '', notes: '' }))
    load(month)
  }

  async function handleMarkReceived(id: string) {
    await markIncomeReceived(id, format(new Date(), 'yyyy-MM-dd'))
    load(month)
  }

  const totalExpected = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalReceived = incomes.filter(i => i.received_date).reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">Entradas</h1>
              <p className="text-slate-400 text-sm">
                Previsto: {fmt(totalExpected)} • Recebido: {fmt(totalReceived)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
                <Plus size={16} /> Nova
              </button>
            </div>
          </div>

          {showForm && (
            <div className="card border-green-800">
              <h2 className="text-sm font-semibold text-white mb-4">Nova entrada</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Descrição</label>
                  <input className="input" placeholder="Ex: Vale alimentação, Salário..." required
                    value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="0,00" required
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Data prevista</label>
                  <input className="input" type="date" required
                    value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Perfil</label>
                  <select className="input" value={form.profile_id} required
                    onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
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

          {/* Perfis como seções */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map(profile => {
                const profileIncomes = incomes.filter(i => i.profile_id === profile.id)
                if (!profileIncomes.length) return null
                return (
                  <div key={profile.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: profile.color }} />
                      <h2 className="text-sm font-semibold text-slate-300">{profile.name}</h2>
                    </div>
                    <div className="space-y-2">
                      {profileIncomes.map(income => (
                        <div key={income.id}
                          className={`card flex items-center gap-3 ${income.received_date ? 'border-green-800 opacity-80' : ''}`}>
                          {income.received_date
                            ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                            : <Clock size={18} className="text-slate-400 flex-shrink-0" />
                          }
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{income.label}</p>
                            <p className="text-xs text-slate-400">
                              Previsto: {income.expected_date}
                              {income.received_date && ` • Recebido: ${income.received_date}`}
                            </p>
                          </div>
                          <p className={`text-sm font-bold ${income.received_date ? 'text-green-400' : 'text-slate-300'}`}>
                            {fmt(income.amount)}
                          </p>
                          {!income.received_date && (
                            <button onClick={() => handleMarkReceived(income.id)}
                              className="text-xs btn-secondary py-1">
                              Recebido
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {incomes.length === 0 && (
                <div className="card text-center py-10 text-slate-500">
                  Nenhuma entrada em {month}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
