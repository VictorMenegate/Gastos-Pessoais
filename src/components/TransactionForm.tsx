'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getCategories, getPaymentMethods, getProfiles } from '@/lib/queries'
import type { Category, PaymentMethod, Profile, TransactionType, TransactionFormData } from '@/types'

interface Props {
  defaultType?: TransactionType
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<TransactionFormData>
}

export default function TransactionForm({ defaultType = 'expense', onSubmit, onCancel, initialData }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<TransactionFormData>({
    type: defaultType,
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    payment_method_id: '',
    profile_id: '',
    notes: '',
    tags: [],
    ...initialData,
  })

  useEffect(() => {
    Promise.all([
      getCategories(form.type),
      getPaymentMethods(),
      getProfiles(),
    ]).then(([cats, pms, profs]) => {
      setCategories(cats)
      setPaymentMethods(pms)
      setProfiles(profs)
      if (!form.profile_id && profs.length) setForm(f => ({ ...f, profile_id: profs[0].id }))
      if (!form.payment_method_id && pms.length) {
        const def = pms.find(p => p.is_default)
        if (def) setForm(f => ({ ...f, payment_method_id: def.id }))
      }
    })
  }, [])

  // Recarrega categorias ao mudar tipo
  useEffect(() => {
    getCategories(form.type).then(setCategories)
  }, [form.type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card border-green-800">
      <h2 className="text-sm font-semibold text-white mb-4">
        {form.type === 'income' ? '📥 Nova entrada' : '📤 Nova saída'}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {/* Tipo */}
        <div className="col-span-2 flex gap-2">
          <button type="button"
            onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.type === 'expense'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}>
            📤 Saída
          </button>
          <button type="button"
            onClick={() => setForm(f => ({ ...f, type: 'income' }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.type === 'income'
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}>
            📥 Entrada
          </button>
        </div>

        {/* Descrição */}
        <div className="col-span-2">
          <label className="label">Descrição</label>
          <input className="input" placeholder="Ex: Mercado, Salário..." required
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {/* Valor */}
        <div>
          <label className="label">Valor (R$)</label>
          <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" required
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>

        {/* Data */}
        <div>
          <label className="label">Data</label>
          <input className="input" type="date" required
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        {/* Categoria */}
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">Sem categoria</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Método de pagamento */}
        <div>
          <label className="label">Pagamento</label>
          <select className="input" value={form.payment_method_id}
            onChange={e => setForm(f => ({ ...f, payment_method_id: e.target.value }))}>
            <option value="">Não informado</option>
            {paymentMethods.map(pm => (
              <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
            ))}
          </select>
        </div>

        {/* Perfil */}
        <div>
          <label className="label">Quem</label>
          <select className="input" value={form.profile_id} required
            onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Observações */}
        <div>
          <label className="label">Observação</label>
          <input className="input" placeholder="..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {/* Botões */}
        <div className="col-span-2 flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
