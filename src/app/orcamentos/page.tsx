'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { getBudgetStatus, upsertBudget, deleteBudget, getCategories, getProfiles } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import BottomSheet from '@/components/BottomSheet'
import EmptyState from '@/components/EmptyState'
import ProgressBar from '@/components/ProgressBar'
import { SkeletonList } from '@/components/Skeleton'
import { useStaggerIn } from '@/lib/useAnime'
import type { BudgetStatus, Category, Profile } from '@/types'

export default function OrcamentosPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [budgets, setBudgets] = useState<BudgetStatus[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const listRef = useStaggerIn([loading])

  const [form, setForm] = useState({
    category_id: '', amount: '', alert_threshold: '80', profile_id: '',
  })

  async function load(m: string) {
    setLoading(true)
    const [bds, cats, profs] = await Promise.all([
      getBudgetStatus(m), getCategories('expense'), getProfiles(),
    ])
    setBudgets(bds); setCategories(cats); setProfiles(profs)
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const account = profiles[0]?.account_id
    if (!account) return
    await upsertBudget({
      account_id: account,
      category_id: form.category_id,
      profile_id: form.profile_id || undefined,
      amount: parseFloat(form.amount),
      alert_threshold: parseFloat(form.alert_threshold) / 100,
    } as any)
    setShowForm(false)
    setForm(f => ({ ...f, amount: '', category_id: '' }))
    load(month)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este orçamento?')) return
    await deleteBudget(id)
    load(month)
  }

  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget_amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent_amount), 0)
  const totalPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0

  return (
    <PageShell
      hero={
        <PageHero
          title="Orçamentos"
          subtitle={`${budgets.length} ${budgets.length === 1 ? 'categoria orçada' : 'categorias orçadas'}`}
          value={loading ? '—' : formatCurrency(totalSpent)}
          valueLabel={`gasto de ${formatCurrency(totalBudget)} orçados`}
          loading={loading}
          actions={<MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} variant="dark" compact />}
          pills={
            <button data-anim="pill" onClick={() => setShowForm(true)}
              className="pill-btn flex-1 max-w-[220px] opacity-0">
              <Plus size={16} /> Novo orçamento
            </button>
          }
          footer={budgets.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: `${totalPct}%`, transition: 'width 700ms ease' }} />
              </div>
              <span className="text-white/80 text-[10px] font-bold">{totalPct}%</span>
            </div>
          ) : undefined}
        />
      }
    >
      {/* Header desktop (mobile usa o hero) */}
      <div className="hidden md:flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fg">Orçamentos</h1>
          <p className="text-fg-secondary text-sm">
            Gasto: {formatCurrency(totalSpent)} de {formatCurrency(totalBudget)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} compact />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      {/* Progresso total — o hero cobre isso no mobile */}
      {budgets.length > 0 && (
        <div className="card hidden md:block">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-fg">Total orçado</span>
            <span className="text-fg-secondary">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <ProgressBar
            value={totalSpent}
            max={totalBudget}
            color={totalSpent / totalBudget >= 1 ? 'var(--red)' : totalSpent / totalBudget >= 0.8 ? 'var(--amber)' : 'var(--accent)'}
            size="md"
          />
        </div>
      )}

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Novo orçamento">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={form.category_id} required
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Selecione</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Limite (R$)</label>
            <input className="input" type="number" step="0.01" min="1" required
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Alerta em (%)</label>
            <input className="input" type="number" min="50" max="100"
              value={form.alert_threshold} onChange={e => setForm(f => ({ ...f, alert_threshold: e.target.value }))} />
          </div>
          <div>
            <label className="label">Perfil (opcional)</label>
            <select className="input" value={form.profile_id}
              onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
              <option value="">Todos</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </BottomSheet>

      {loading ? <SkeletonList rows={4} /> : budgets.length === 0 ? (
        <EmptyState icon="📊" title="Nenhum orçamento configurado" description="Defina limites por categoria para controlar seus gastos" />
      ) : (
        <div ref={listRef} className="space-y-3">
          {budgets.map(b => {
            const pct = Number(b.spent_percentage)
            const corLimite = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : undefined
            return (
              <div key={b.budget_id} className="card space-y-2"
                style={corLimite ? { borderColor: corLimite } : undefined}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: 'rgba(var(--accent-rgb), 0.08)' }}>
                      {b.category_icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fg">{b.category_name}</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        {formatCurrency(b.spent_amount)} de {formatCurrency(b.budget_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold tabular-nums ${
                      pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-600' : 'text-brand-500'
                    }`}>
                      {pct.toFixed(0)}%
                    </span>
                    <button onClick={() => handleDelete(b.budget_id)}
                      className="text-fg-muted hover:text-red-500" aria-label="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <ProgressBar
                  value={b.spent_amount}
                  max={b.budget_amount}
                  color={pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--accent)'}
                  showLabel={false}
                  size="md"
                />
                {pct >= 100 && (
                  <p className="text-xs text-red-500">
                    Excedido em {formatCurrency(b.spent_amount - b.budget_amount)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
