'use client'

import { useEffect, useState } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { getInstallments, createInstallment, markInstallmentPaid, getCategories, getPaymentMethods, getProfiles } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import BottomSheet from '@/components/BottomSheet'
import EmptyState from '@/components/EmptyState'
import ProgressBar from '@/components/ProgressBar'
import { SkeletonList } from '@/components/Skeleton'
import { useStaggerIn } from '@/lib/useAnime'
import type { Category, PaymentMethod, Profile } from '@/types'

export default function ParceladosPage() {
  const [installments, setInstallments] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const listRef = useStaggerIn([loading])

  const [form, setForm] = useState({
    description: '', total_amount: '', installment_value: '',
    total_installments: '', start_date: new Date().toISOString().slice(0, 10),
    due_day: '10', category_id: '', payment_method_id: '', profile_id: '', notes: '',
  })

  async function load() {
    setLoading(true)
    const [inst, cats, pms, profs] = await Promise.all([
      getInstallments(), getCategories('expense'), getPaymentMethods(), getProfiles(),
    ])
    setInstallments(inst); setCategories(cats); setPaymentMethods(pms); setProfiles(profs)
    if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleTotalOrQty(field: string, value: string) {
    const next = { ...form, [field]: value }
    if (next.total_amount && next.total_installments) {
      next.installment_value = (parseFloat(next.total_amount) / parseInt(next.total_installments)).toFixed(2)
    }
    setForm(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const account = profiles[0]?.account_id
    if (!account) return
    await createInstallment({
      account_id: account,
      description: form.description,
      total_amount: parseFloat(form.total_amount),
      installment_value: parseFloat(form.installment_value),
      total_installments: parseInt(form.total_installments),
      due_day: parseInt(form.due_day),
      start_date: form.start_date,
      paid_installments: 0,
      active: true,
      category_id: form.category_id || undefined,
      payment_method_id: form.payment_method_id || undefined,
      profile_id: form.profile_id,
      notes: form.notes || undefined,
    } as any)
    setShowForm(false)
    load()
  }

  async function handleMarkPaid(id: string) {
    if (!confirm('Marcar próxima parcela como paga?')) return
    await markInstallmentPaid(id)
    load()
  }

  const totalMonthly = installments.reduce((s: number, i: any) => s + Number(i.installment_value), 0)

  return (
    <PageShell
      hero={
        <PageHero
          title="Parcelados"
          subtitle={`${installments.length} ${installments.length === 1 ? 'parcelamento ativo' : 'parcelamentos ativos'}`}
          value={loading ? '—' : formatCurrency(totalMonthly)}
          valueLabel="compromisso mensal"
          loading={loading}
          pills={
            <button data-anim="pill" onClick={() => setShowForm(true)}
              className="pill-btn flex-1 max-w-[220px] opacity-0">
              <Plus size={16} /> Novo parcelamento
            </button>
          }
        />
      }
    >
      {/* Header desktop (mobile usa o hero) */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fg">Parcelados</h1>
          <p className="text-fg-secondary text-sm">Compromisso mensal: {formatCurrency(totalMonthly)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Novo
        </button>
      </div>

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Novo parcelamento">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <input className="input" placeholder="Ex: TV Samsung..." required
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Valor total (R$)</label>
            <input className="input" type="number" step="0.01" required
              value={form.total_amount} onChange={e => handleTotalOrQty('total_amount', e.target.value)} />
          </div>
          <div>
            <label className="label">Nº de parcelas</label>
            <input className="input" type="number" min="2" required
              value={form.total_installments} onChange={e => handleTotalOrQty('total_installments', e.target.value)} />
          </div>
          <div>
            <label className="label">Valor por parcela (R$)</label>
            <input className="input" type="number" step="0.01" required
              value={form.installment_value} onChange={e => setForm(f => ({ ...f, installment_value: e.target.value }))} />
          </div>
          <div>
            <label className="label">Dia vencimento</label>
            <input className="input" type="number" min="1" max="31" required
              value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data início</label>
            <input className="input" type="date" required
              value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
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
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </BottomSheet>

      {loading ? <SkeletonList rows={4} /> : installments.length === 0 ? (
        <EmptyState icon="💳" title="Nenhum parcelamento ativo" description="Registre compras parceladas para acompanhar" />
      ) : (
        <div ref={listRef} className="space-y-3">
          {installments.map((inst: any) => {
            return (
              <div key={inst.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={16} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{inst.description}</p>
                      <p className="text-xs text-fg-muted mt-0.5 truncate">
                        {inst.categories?.icon} {inst.categories?.name}
                        {inst.payment_methods && ` • ${inst.payment_methods.icon} ${inst.payment_methods.name}`}
                        {` • ${inst.profiles?.name} • dia ${inst.due_day}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-fg tabular-nums">{formatCurrency(inst.installment_value)}/mês</p>
                    <p className="text-xs text-fg-secondary">{inst.total_installments - inst.paid_installments} restantes</p>
                  </div>
                </div>
                <ProgressBar value={inst.paid_installments} max={inst.total_installments} />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-fg-secondary">
                    Total: {formatCurrency(inst.total_amount)} • Pago: {formatCurrency(inst.paid_installments * inst.installment_value)}
                  </p>
                  <button onClick={() => handleMarkPaid(inst.id)} className="btn-secondary text-xs py-1">
                    Pagar parcela
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
