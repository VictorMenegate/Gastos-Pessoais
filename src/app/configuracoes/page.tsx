'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { getProfiles, upsertProfile } from '@/lib/queries'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import type { Profile, SalaryEntry } from '@/types'

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#db2777', '#ea580c', '#0891b2']

export default function ConfiguracoesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    const profs = await getProfiles()
    setProfiles(profs.length ? profs : [{
      id: '', user_id: user?.id ?? '', name: '', payment_type: 'single',
      salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: COLORS[0], created_at: '', updated_at: '',
    }])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
    setProfiles(prev => prev.map((p, i) => {
      if (i !== profIdx) return p
      return { ...p, salary_schedule: [...p.salary_schedule, { label: 'Nova entrada', amount: 0, day: 5 }] }
    }))
  }

  function removeSalaryEntry(profIdx: number, entryIdx: number) {
    setProfiles(prev => prev.map((p, i) => {
      if (i !== profIdx) return p
      return { ...p, salary_schedule: p.salary_schedule.filter((_, j) => j !== entryIdx) }
    }))
  }

  function addProfile() {
    setProfiles(prev => [...prev, {
      id: '', user_id: userId, name: '', payment_type: 'single',
      salary_schedule: [{ label: 'Salário', amount: 0, day: 5 }],
      color: COLORS[prev.length % COLORS.length], created_at: '', updated_at: '',
    }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const profile of profiles) {
        if (!profile.name.trim()) continue
        await upsertProfile({
          ...profile,
          user_id: userId,
          salary_schedule: profile.salary_schedule.map(e => ({
            label: e.label,
            amount: Number(e.amount),
            day: Number(e.day),
          })),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Configurações</h1>
              <p className="text-slate-400 text-sm">Perfis e agendamento de salários</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-500" />
            </div>
          ) : (
            <>
              {profiles.map((profile, profIdx) => (
                <div key={profIdx} className="card space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: profile.color }} />
                    <h2 className="text-sm font-semibold text-white">
                      {profile.name || `Perfil ${profIdx + 1}`}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nome</label>
                      <input className="input" placeholder="Ex: Victor, Ana..." value={profile.name}
                        onChange={e => updateProfile(profIdx, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Cor do perfil</label>
                      <div className="flex gap-2 mt-1">
                        {COLORS.map(color => (
                          <button key={color} type="button"
                            onClick={() => updateProfile(profIdx, 'color', color)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${profile.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">Tipo de pagamento</label>
                    <div className="flex gap-2 mt-1">
                      <button type="button"
                        onClick={() => updateProfile(profIdx, 'payment_type', 'single')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          profile.payment_type === 'single'
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}>
                        Tudo junto
                      </button>
                      <button type="button"
                        onClick={() => updateProfile(profIdx, 'payment_type', 'split')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          profile.payment_type === 'split'
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}>
                        Vale + Salário separados
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {profile.payment_type === 'split'
                        ? 'Ex: Vale dia 5 + Salário dia 20'
                        : 'Ex: Salário completo dia 10'}
                    </p>
                  </div>

                  {/* Entradas de salário */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Entradas de salário</label>
                      <button type="button" onClick={() => addSalaryEntry(profIdx)}
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {profile.salary_schedule.map((entry, entryIdx) => (
                        <div key={entryIdx} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <input className="input text-sm" placeholder="Descrição"
                              value={entry.label}
                              onChange={e => updateSalaryEntry(profIdx, entryIdx, 'label', e.target.value)} />
                          </div>
                          <div className="w-28">
                            <input className="input text-sm" type="number" step="0.01" placeholder="Valor"
                              value={entry.amount || ''}
                              onChange={e => updateSalaryEntry(profIdx, entryIdx, 'amount', e.target.value)} />
                          </div>
                          <div className="w-20">
                            <input className="input text-sm" type="number" min="1" max="31" placeholder="Dia"
                              value={entry.day || ''}
                              onChange={e => updateSalaryEntry(profIdx, entryIdx, 'day', e.target.value)} />
                          </div>
                          {profile.salary_schedule.length > 1 && (
                            <button type="button" onClick={() => removeSalaryEntry(profIdx, entryIdx)}
                              className="text-slate-500 hover:text-red-400 pb-2">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-slate-500">
                        Total mensal previsto:{' '}
                        <span className="text-green-400 font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                            .format(profile.salary_schedule.reduce((s, e) => s + e.amount, 0))}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {profiles.length < 4 && (
                <button onClick={addProfile}
                  className="w-full border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl py-4 text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors">
                  <Plus size={16} /> Adicionar outro perfil (namorada, etc.)
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
