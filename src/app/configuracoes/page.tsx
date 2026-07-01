'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Users, Palette, Home, Check, Copy } from 'lucide-react'
import { getProfiles, upsertProfile, getAccount } from '@/lib/queries'
import { createClient } from '@/lib/supabase/client'
import { PROFILE_COLORS } from '@/lib/constants'
import { TEMAS, TEMA_PADRAO, temaSalvo, salvarTema, type TemaApp } from '@/lib/theme'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import NativeSettings from '@/components/NativeSettings'
import type { Profile, SalaryEntry, Account } from '@/types'

type Tab = 'profiles' | 'account' | 'appearance'

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('profiles')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [temaAtual, setTemaAtual] = useState(TEMA_PADRAO.id)

  useEffect(() => { setTemaAtual(temaSalvo().id) }, [])

  function escolherTema(tema: TemaApp) {
    salvarTema(tema)
    setTemaAtual(tema.id)
  }

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const [profs, acc] = await Promise.all([getProfiles(), getAccount()])
    setProfiles(profs.length ? profs : [{
      id: '', user_id: user?.id ?? '', account_id: '', name: '',
      salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: PROFILE_COLORS[0], avatar_url: null, role: 'owner', whatsapp_phone: null,
      created_at: '', updated_at: '',
    }])
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
      id: '', user_id: userId, account_id: profiles[0]?.account_id ?? '', name: '',
      salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: PROFILE_COLORS[prev.length % PROFILE_COLORS.length], avatar_url: null, role: 'member',
      whatsapp_phone: null, created_at: '', updated_at: '',
    }])
  }

  async function handleSaveProfiles() {
    setSaving(true)
    setErroSalvar('')
    try {
      for (const profile of profiles) {
        if (!profile.name.trim()) continue
        await upsertProfile({
          // preserva o dono original do perfil (membros convidados têm login próprio)
          ...profile, user_id: profile.user_id || userId,
          salary_schedule: profile.salary_schedule.map(e => ({
            label: e.label, amount: Number(e.amount), day: Number(e.day),
          })),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      load()
    } catch (err: any) {
      setErroSalvar(err?.message ?? 'Erro ao salvar o perfil. Tente novamente.')
    } finally { setSaving(false) }
  }

  async function copiarLinkConvite() {
    if (!account?.invite_code) return
    const link = `${window.location.origin}/login?convite=${account.invite_code}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // fallback p/ WebView sem clipboard API
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'profiles', label: 'Perfis', icon: Users },
    { key: 'account', label: 'Conta', icon: Home },
    { key: 'appearance', label: 'Aparência', icon: Palette },
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
                  {erroSalvar && (
                    <div className="text-sm font-medium p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
                      Erro ao salvar: {erroSalvar}
                    </div>
                  )}
                  {profiles.map((profile, profIdx) => (
                    <div key={profIdx} className="card space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: profile.color }} />
                        <h2 className="text-sm font-semibold text-fg">{profile.name || `Perfil ${profIdx + 1}`}</h2>
                      </div>

                      <div>
                        <label className="label">Nome</label>
                        <input className="input" placeholder="Victor, Ana..."
                          value={profile.name} onChange={e => updateProfile(profIdx, 'name', e.target.value)} />
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
                      <label className="label">Link de convite</label>
                      <p className="text-sm text-fg">
                        Envie para um familiar: ele cria o próprio login e já entra nesta conta.
                      </p>
                      <code className="text-lg font-mono text-brand-500 bg-surface-input px-4 py-2 rounded-lg block text-center mt-2">
                        {account?.invite_code ?? '---'}
                      </code>
                      {account?.invite_code && (
                        <button type="button" onClick={copiarLinkConvite}
                          className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                          {linkCopiado ? <Check size={16} /> : <Copy size={16} />}
                          {linkCopiado ? 'Link copiado!' : 'Copiar link de convite'}
                        </button>
                      )}
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

                  <NativeSettings />
                </div>
              )}

              {/* ── APPEARANCE TAB ── */}
              {tab === 'appearance' && (
                <div className="card space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-fg">Cor do app</h2>
                    <p className="text-xs text-fg-muted mt-1">
                      Muda a cor principal de toda a interface. A escolha fica salva neste aparelho.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TEMAS.map(tema => {
                      const selecionado = temaAtual === tema.id
                      return (
                        <button key={tema.id} type="button" onClick={() => escolherTema(tema)}
                          className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-colors ${
                            selecionado ? 'bg-surface-input' : 'hover:bg-surface-input/60'
                          }`}>
                          <span className="w-10 h-10 rounded-full flex items-center justify-center transition-transform"
                            style={{
                              background: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.accentLight} 100%)`,
                              boxShadow: selecionado ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${tema.accent}` : 'none',
                              transform: selecionado ? 'scale(1.05)' : 'scale(1)',
                            }}>
                            {selecionado && <Check size={18} className="text-white" strokeWidth={3} />}
                          </span>
                          <span className={`text-xs ${selecionado ? 'font-bold text-fg' : 'font-medium text-fg-secondary'}`}>
                            {tema.nome}
                          </span>
                        </button>
                      )
                    })}
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
