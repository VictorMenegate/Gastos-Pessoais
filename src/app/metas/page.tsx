'use client'

import { useEffect, useState } from 'react'
import { Plus, Target, TrendingUp } from 'lucide-react'
import { getFinancialGoals, createFinancialGoal, addGoalContribution, getProfiles } from '@/lib/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GOAL_ICONS, PROFILE_COLORS } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import ProgressBar from '@/components/ProgressBar'
import type { FinancialGoal, Profile } from '@/types'

export default function MetasPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showContributeId, setShowContributeId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | undefined>('active')

  const [form, setForm] = useState({
    name: '', description: '', target_amount: '', deadline: '',
    icon: '🎯', color: '#6366f1', profile_id: '',
  })

  async function load() {
    setLoading(true)
    const [g, p] = await Promise.all([getFinancialGoals(filterStatus), getProfiles()])
    setGoals(g); setProfiles(p)
    if (!form.profile_id && p.length) setForm(f => ({ ...f, profile_id: p[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [filterStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const account = profiles[0]?.account_id
    if (!account) return
    await createFinancialGoal({
      account_id: account,
      name: form.name,
      description: form.description || undefined,
      target_amount: parseFloat(form.target_amount),
      deadline: form.deadline || undefined,
      icon: form.icon,
      color: form.color,
      profile_id: form.profile_id || undefined,
    } as any)
    setShowForm(false)
    setForm(f => ({ ...f, name: '', description: '', target_amount: '', deadline: '' }))
    load()
  }

  async function handleContribute(goalId: string) {
    if (!contributeAmount) return
    await addGoalContribution({
      goal_id: goalId,
      profile_id: profiles[0]?.id,
      amount: parseFloat(contributeAmount),
    })
    setShowContributeId(null)
    setContributeAmount('')
    load()
  }

  return (
    <div className="min-h-screen" style={{ background: '#e8ebf0' }}>
      <Sidebar />
      <main className="md:ml-[240px] pb-24 md:pb-6 md:py-3 md:pr-3">
        <div className="md:bg-white md:min-h-[calc(100vh-24px)] md:overflow-auto" style={{ borderRadius: 'var(--content-radius, 0)' }}>
        <div className="p-4 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-fg">Metas Financeiras</h1>
              <p className="text-fg-secondary text-sm">{goals.length} meta(s) {filterStatus === 'active' ? 'ativas' : 'concluídas'}</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
              <Plus size={16} /> Nova meta
            </button>
          </div>

          {/* Filters */}
          <div className="filter-tabs">
            {([['active', 'Ativas'], ['completed', 'Concluídas']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterStatus(val as any)}
                className={`filter-tab ${filterStatus === val ? 'filter-tab-active' : ''}`}>{lbl}</button>
            ))}
          </div>

          {showForm && (
            <div className="card border-brand-200">
              <h2 className="text-sm font-semibold text-fg mb-4">Nova meta</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nome da meta</label>
                  <input className="input" placeholder="Ex: Viagem, Carro novo..." required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor alvo (R$)</label>
                  <input className="input" type="number" step="0.01" min="1" required
                    value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Prazo (opcional)</label>
                  <input className="input" type="date"
                    value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ícone</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {GOAL_ICONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                          form.icon === icon ? 'bg-surface-hover ring-2 ring-brand-500' : 'bg-surface-input border border-surface-border hover:bg-surface-hover'
                        }`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Cor</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PROFILE_COLORS.slice(0, 6).map(color => (
                      <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          form.color === color ? 'border-white scale-110' : 'border-transparent'
                        }`} style={{ background: color }} />
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">Descrição (opcional)</label>
                  <input className="input" placeholder="Detalhes sobre a meta..."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Criar meta</button>
                </div>
              </form>
            </div>
          )}

          {loading ? <Loading /> : goals.length === 0 ? (
            <EmptyState icon="🎯" title="Nenhuma meta"
              description={filterStatus === 'active' ? 'Crie metas para economizar com propósito' : 'Nenhuma meta concluída ainda'} />
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const pct = goal.target_amount > 0
                  ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
                  : 0
                return (
                  <div key={goal.id} className="card space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" style={{ filter: goal.status === 'completed' ? 'grayscale(0)' : undefined }}>
                          {goal.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-fg">{goal.name}</p>
                          {goal.description && <p className="text-xs text-fg-secondary">{goal.description}</p>}
                          {goal.deadline && (
                            <p className="text-xs text-fg-muted mt-0.5">Prazo: {formatDate(goal.deadline)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-fg">{formatCurrency(goal.current_amount)}</p>
                        <p className="text-xs text-fg-secondary">de {formatCurrency(goal.target_amount)}</p>
                      </div>
                    </div>

                    <ProgressBar value={Number(goal.current_amount)} max={Number(goal.target_amount)} color={goal.color} size="md" />

                    {goal.status === 'active' && (
                      <div>
                        {showContributeId === goal.id ? (
                          <div className="flex gap-2">
                            <input type="number" step="0.01" min="0.01" placeholder="Valor" className="input flex-1"
                              value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} />
                            <button onClick={() => handleContribute(goal.id)} className="btn-primary text-sm">Adicionar</button>
                            <button onClick={() => setShowContributeId(null)} className="btn-secondary text-sm">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowContributeId(goal.id)}
                            className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                            <TrendingUp size={14} /> Contribuir
                          </button>
                        )}
                      </div>
                    )}

                    {goal.status === 'completed' && (
                      <div className="text-center py-1">
                        <span className="badge-paid">Meta alcançada!</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  )
}
