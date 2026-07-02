'use client'

import { useEffect, useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { getFinancialGoals, createFinancialGoal, addGoalContribution, getProfiles } from '@/lib/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GOAL_ICONS, PROFILE_COLORS } from '@/lib/constants'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import BottomSheet from '@/components/BottomSheet'
import EmptyState from '@/components/EmptyState'
import ProgressBar from '@/components/ProgressBar'
import { SkeletonList } from '@/components/Skeleton'
import { useStaggerIn } from '@/lib/useAnime'
import type { FinancialGoal, Profile } from '@/types'

export default function MetasPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showContributeId, setShowContributeId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | undefined>('active')
  const listRef = useStaggerIn([loading, filterStatus])

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

  const goalContribute = goals.find(g => g.id === showContributeId)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalCurrent = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const goalPct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

  return (
    <PageShell
      hero={
        <PageHero
          title="Metas"
          subtitle={`${goals.length} ${goals.length === 1 ? 'meta' : 'metas'} ${filterStatus === 'active' ? 'ativas' : 'concluídas'}`}
          value={loading ? '—' : `${goalPct}%`}
          valueLabel={`${formatCurrency(totalCurrent)} de ${formatCurrency(totalTarget)}`}
          loading={loading}
          pills={
            <button data-anim="pill" onClick={() => setShowForm(true)}
              className="pill-btn flex-1 max-w-[200px] opacity-0">
              <Plus size={16} /> Nova meta
            </button>
          }
        />
      }
    >
      {/* Header desktop (mobile usa o hero) */}
      <div className="hidden md:flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fg">Metas Financeiras</h1>
          <p className="text-fg-secondary text-sm">{goals.length} meta(s) {filterStatus === 'active' ? 'ativas' : 'concluídas'}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {/* Filtros */}
      <div className="filter-tabs">
        {([['active', 'Ativas'], ['completed', 'Concluídas']] as const).map(([val, lbl]) => (
          <button key={val} onClick={() => setFilterStatus(val as any)}
            className={`filter-tab ${filterStatus === val ? 'filter-tab-active' : ''}`}>{lbl}</button>
        ))}
      </div>

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Nova meta">
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
          <div className="col-span-2 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar meta</button>
          </div>
        </form>
      </BottomSheet>

      {/* Contribuição — sheet no mobile, card inline no desktop */}
      <BottomSheet open={!!showContributeId} onClose={() => setShowContributeId(null)}
        title={goalContribute ? `${goalContribute.icon} Contribuir — ${goalContribute.name}` : 'Contribuir'}>
        <div className="flex gap-2">
          <input type="number" step="0.01" min="0.01" placeholder="Valor" className="input flex-1" autoFocus
            value={contributeAmount} onChange={e => setContributeAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && showContributeId && handleContribute(showContributeId)} />
          <button onClick={() => showContributeId && handleContribute(showContributeId)} className="btn-primary text-sm">Adicionar</button>
        </div>
      </BottomSheet>

      {loading ? <SkeletonList rows={4} /> : goals.length === 0 ? (
        <EmptyState icon="🎯" title="Nenhuma meta"
          description={filterStatus === 'active' ? 'Crie metas para economizar com propósito' : 'Nenhuma meta concluída ainda'} />
      ) : (
        <div ref={listRef} className="space-y-3">
          {goals.map(goal => {
            return (
              <div key={goal.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: `${goal.color}1a` }}>
                      {goal.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{goal.name}</p>
                      {goal.description && <p className="text-xs text-fg-secondary truncate">{goal.description}</p>}
                      {goal.deadline && (
                        <p className="text-xs text-fg-muted mt-0.5">Prazo: {formatDate(goal.deadline)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-fg tabular-nums">{formatCurrency(goal.current_amount)}</p>
                    <p className="text-xs text-fg-secondary">de {formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>

                <ProgressBar value={Number(goal.current_amount)} max={Number(goal.target_amount)} color={goal.color} size="md" />

                {goal.status === 'active' && (
                  <button onClick={() => { setContributeAmount(''); setShowContributeId(goal.id) }}
                    className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                    <TrendingUp size={14} /> Contribuir
                  </button>
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
    </PageShell>
  )
}
