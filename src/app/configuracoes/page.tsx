'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Users, CreditCard, MessageCircle, Palette } from 'lucide-react'
import { getProfiles, upsertProfile, getPaymentMethods, createPaymentMethod, getAccount } from '@/lib/queries'
import { createClient } from '@/lib/supabase/client'
import { PROFILE_COLORS, PAYMENT_METHOD_TYPES } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import type { Profile, SalaryEntry, PaymentMethod, Account } from '@/types'

type Tab = 'profiles' | 'payments' | 'whatsapp' | 'account'

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('profiles')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const [profs, pms, acc] = await Promise.all([getProfiles(), getPaymentMethods(), getAccount()])
    setProfiles(profs.length ? profs : [{
      id: '', user_id: user?.id ?? '', account_id: '', name: '', salary: 0,
      payment_type: 'single', salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: PROFILE_COLORS[0], avatar_url: null, role: 'owner', whatsapp_phone: null,
      created_at: '', updated_at: '',
    }])
    setPaymentMethods(pms)
    setAccount(acc)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // --- Profile helpers ---
  function updateProfile(idx: number, field: keyof Profile, value: any) {
    setProfiles(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  function updateSalaryEntry(profIdx: number, entryIdx: number, field: keyof SalaryEntry, value: any) {
    setProfiles(prev => prev.map((p, i) => {
      if (i !== profIdx) return p
      const schedule = [...p.salary_schedule]
      schedule[entryIdx] = { ...schedule[entryIdx], [field]: field === 'amount' || field === 'day' ? Number(value) : value }
      return { ...p, salary_schedule: schedule }
    }))
  }

  function addSalaryEntry(profIdx: number) {
    setProfiles(prev => prev.map((p, i) => i !== profIdx ? p : {
      ...p, salary_schedule: [...p.salary_schedule, { label: 'Nova entrada', amount: 0, day: 5 }]
    }))
  }

  function removeSalaryEntry(profIdx: number, entryIdx: number) {
    setProfiles(prev => prev.map((p, i) => i !== profIdx ? p : {
      ...p, salary_schedule: p.salary_schedule.filter((_, j) => j !== entryIdx)
    }))
  }

  function addProfile() {
    setProfiles(prev => [...prev, {
      id: '', user_id: userId, account_id: profiles[0]?.account_id ?? '', name: '', salary: 0,
      payment_type: 'single', salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: PROFILE_COLORS[prev.length % PROFILE_COLORS.length], avatar_url: null, role: 'member',
      whatsapp_phone: null, created_at: '', updated_at: '',
    }])
  }

  async function handleSaveProfiles() {
    setSaving(true)
    try {
      for (const profile of profiles) {
        if (!profile.name.trim()) continue
        await upsertProfile({
          ...profile, user_id: userId,
          salary_schedule: profile.salary_schedule.map(e => ({
            label: e.label, amount: Number(e.amount), day: Number(e.day),
          })),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      load()
    } finally { setSaving(false) }
  }

  // --- Payment method ---
  const [pmForm, setPmForm] = useState({ name: '', type: 'pix' as any, icon: '⚡', color: '#567EBB' })

  async function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault()
    const accountId = profiles[0]?.account_id
    if (!accountId) return
    await createPaymentMethod({ ...pmForm, account_id: accountId })
    setPmForm({ name: '', type: 'pix', icon: '⚡', color: '#567EBB' })
    load()
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'profiles', label: 'Perfis', icon: Users },
    { key: 'payments', label: 'Pagamentos', icon: CreditCard },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'account', label: 'Conta', icon: Palette },
  ]

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="min-h-screen" style={{ background: '#e8ebf0' }}>
      <Sidebar />
      <main className="md:ml-[240px] pb-24 md:pb-6 md:py-3 md:pr-3">
        <div className="md:bg-white md:min-h-[calc(100vh-24px)] md:overflow-auto" style={{ borderRadius: 'var(--content-radius, 0)' }}>
        <div className="p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-fg">Configurações</h1>
            {tab === 'profiles' && (
              <button onClick={handleSaveProfiles} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={16} />
                {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="filter-tabs overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`filter-tab flex items-center gap-1.5 whitespace-nowrap ${
                  tab === key ? 'filter-tab-active' : ''
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {loading ? <Loading /> : (
            <>
              {/* ── PROFILES TAB ── */}
              {tab === 'profiles' && (
                <div className="space-y-4">
                  {profiles.map((profile, profIdx) => (
                    <div key={profIdx} className="card space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: profile.color }} />
                        <h2 className="text-sm font-semibold text-fg">{profile.name || `Perfil ${profIdx + 1}`}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Nome</label>
                          <input className="input" placeholder="Victor, Ana..."
                            value={profile.name} onChange={e => updateProfile(profIdx, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label className="label">Salário</label>
                          <input className="input" type="number" step="0.01"
                            value={profile.salary || ''} onChange={e => updateProfile(profIdx, 'salary', Number(e.target.value))} />
                        </div>
                      </div>

                      <div>
                        <label className="label">WhatsApp</label>
                        <input className="input" placeholder="5511999999999 (com DDI)"
                          value={profile.whatsapp_phone ?? ''} onChange={e => updateProfile(profIdx, 'whatsapp_phone', e.target.value)} />
                        <p className="text-xs text-fg-muted mt-1">Vincule para enviar transações pelo WhatsApp</p>
                      </div>

                      <div>
                        <label className="label">Cor do perfil</label>
                        <div className="flex gap-2 mt-1">
                          {PROFILE_COLORS.slice(0, 8).map(color => (
                            <button key={color} type="button" onClick={() => updateProfile(profIdx, 'color', color)}
                              className={`w-7 h-7 rounded-full border-2 transition-all ${
                                profile.color === color ? 'border-white scale-110' : 'border-transparent'
                              }`} style={{ background: color }} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="label">Tipo de pagamento</label>
                        <div className="flex gap-2 mt-1">
                          {(['single', 'split'] as const).map(pt => (
                            <button key={pt} type="button" onClick={() => updateProfile(profIdx, 'payment_type', pt)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                profile.payment_type === pt
                                  ? 'bg-brand-500 border-brand-500 text-white'
                                  : 'bg-surface-input border border-surface-border text-fg-secondary hover:bg-surface-hover'
                              }`}
                            >{pt === 'single' ? 'Tudo junto' : 'Vale + Salário'}</button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="label mb-0">Entradas de salário</label>
                          <button type="button" onClick={() => addSalaryEntry(profIdx)}
                            className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1">
                            <Plus size={12} /> Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {profile.salary_schedule.map((entry, entryIdx) => (
                            <div key={entryIdx} className="flex gap-2 items-end">
                              <div className="flex-1">
                                <input className="input text-sm" placeholder="Descrição"
                                  value={entry.label} onChange={e => updateSalaryEntry(profIdx, entryIdx, 'label', e.target.value)} />
                              </div>
                              <div className="w-28">
                                <input className="input text-sm" type="number" step="0.01" placeholder="Valor"
                                  value={entry.amount || ''} onChange={e => updateSalaryEntry(profIdx, entryIdx, 'amount', e.target.value)} />
                              </div>
                              <div className="w-20">
                                <input className="input text-sm" type="number" min="1" max="31" placeholder="Dia"
                                  value={entry.day || ''} onChange={e => updateSalaryEntry(profIdx, entryIdx, 'day', e.target.value)} />
                              </div>
                              {profile.salary_schedule.length > 1 && (
                                <button type="button" onClick={() => removeSalaryEntry(profIdx, entryIdx)}
                                  className="text-fg-muted hover:text-red-500 pb-2">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-fg-muted">
                            Total mensal: <span className="text-brand-500 font-medium">
                              {fmt(profile.salary_schedule.reduce((s, e) => s + e.amount, 0))}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {profiles.length < 6 && (
                    <button onClick={addProfile}
                      className="w-full border-2 border-dashed border-surface-border hover:border-brand-500 rounded-xl py-4 text-fg-secondary hover:text-fg text-sm flex items-center justify-center gap-2 transition-colors">
                      <Plus size={16} /> Adicionar perfil
                    </button>
                  )}
                </div>
              )}

              {/* ── PAYMENTS TAB ── */}
              {tab === 'payments' && (
                <div className="space-y-4">
                  <div className="card">
                    <h2 className="text-sm font-semibold text-fg mb-4">Adicionar método</h2>
                    <form onSubmit={handleAddPaymentMethod} className="flex flex-wrap gap-3">
                      <input className="input flex-1 min-w-[150px]" placeholder="Nome do método" required
                        value={pmForm.name} onChange={e => setPmForm(f => ({ ...f, name: e.target.value }))} />
                      <select className="input w-40" value={pmForm.type}
                        onChange={e => {
                          const opt = PAYMENT_METHOD_TYPES.find(o => o.value === e.target.value)
                          setPmForm(f => ({ ...f, type: e.target.value, icon: opt?.icon ?? '💸' }))
                        }}>
                        {PAYMENT_METHOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                      <button type="submit" className="btn-primary">Adicionar</button>
                    </form>
                  </div>
                  <div className="space-y-2">
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className="card flex items-center gap-3">
                        <span className="text-xl">{pm.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-fg">{pm.name}</p>
                          <p className="text-xs text-fg-secondary">{pm.type}</p>
                        </div>
                        {pm.is_default && <span className="badge-paid">Padrão</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── WHATSAPP TAB ── */}
              {tab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="card space-y-4">
                    <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
                      <MessageCircle size={16} className="text-brand-500" /> Integração WhatsApp (Evolution API)
                    </h2>
                    <div className="bg-surface-input rounded-lg p-4 space-y-3">
                      <p className="text-sm text-fg">Como configurar:</p>
                      <ol className="text-sm text-fg-secondary space-y-2 list-decimal list-inside">
                        <li>Instale a <strong>Evolution API</strong> no EasyPanel (Docker)</li>
                        <li>Crie uma instância e escaneie o <strong>QR Code</strong></li>
                        <li>Configure o webhook da instância para apontar para este app</li>
                        <li>Vincule seu número na aba Perfis</li>
                        <li>Envie mensagens: <code className="text-brand-500">Mercado 120</code></li>
                      </ol>
                    </div>
                    <div className="bg-surface-input rounded-lg p-4">
                      <p className="text-sm text-fg mb-2">Webhook URL (configurar na Evolution API):</p>
                      <code className="text-xs text-brand-500 bg-surface-input border border-surface-border px-3 py-2 rounded block break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}
                      </code>
                      <p className="text-xs text-fg-muted mt-2">Evento: <code>messages.upsert</code></p>
                    </div>
                    <div className="bg-surface-input rounded-lg p-4">
                      <p className="text-sm text-fg mb-2">Variáveis de ambiente necessárias:</p>
                      <div className="space-y-1 text-xs text-fg-secondary font-mono">
                        <p><span className="text-amber-600">EVOLUTION_API_URL</span>=http://evolution:8080</p>
                        <p><span className="text-amber-600">EVOLUTION_API_KEY</span>=sua_api_key</p>
                        <p><span className="text-amber-600">EVOLUTION_INSTANCE</span>=gastos</p>
                      </div>
                    </div>
                    <div className="bg-surface-input rounded-lg p-4">
                      <p className="text-sm text-fg mb-2">Comandos disponíveis:</p>
                      <div className="space-y-1 text-sm text-fg-secondary">
                        <p><code className="text-brand-500">Mercado 120</code> - Registra transação</p>
                        <p><code className="text-brand-500">Almoço 35.50</code> - Com centavos</p>
                        <p><code className="text-brand-500">resumo</code> - Resumo do mês</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-fg mb-2">Números vinculados:</p>
                      {profiles.filter(p => p.whatsapp_phone).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-fg">{p.name}</span>
                          <span className="text-fg-secondary">{p.whatsapp_phone}</span>
                        </div>
                      ))}
                      {!profiles.some(p => p.whatsapp_phone) && (
                        <p className="text-sm text-fg-muted">Nenhum número vinculado. Configure na aba Perfis.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT TAB ── */}
              {tab === 'account' && (
                <div className="space-y-4">
                  <div className="card space-y-4">
                    <h2 className="text-sm font-semibold text-fg">Conta</h2>
                    <div>
                      <label className="label">Nome da conta</label>
                      <p className="text-fg">{account?.name ?? 'Minha Conta'}</p>
                    </div>
                    <div>
                      <label className="label">Código de convite</label>
                      <p className="text-sm text-fg">
                        Compartilhe para adicionar familiares à conta:
                      </p>
                      <code className="text-lg font-mono text-brand-500 bg-surface-input px-4 py-2 rounded-lg block text-center mt-2">
                        {account?.invite_code ?? '---'}
                      </code>
                    </div>
                    <div>
                      <label className="label">Membros</label>
                      <div className="space-y-2">
                        {profiles.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                            <span className="text-fg text-sm">{p.name}</span>
                            <span className="text-xs text-fg-secondary">({p.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>
    </div>
  )
}
