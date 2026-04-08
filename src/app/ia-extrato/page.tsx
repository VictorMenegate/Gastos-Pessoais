'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Check, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { createTransaction, getProfiles, getCategories } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { monthRefFromDate } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import type { Profile, Category } from '@/types'

const BANKS = [
  { name: 'Nubank',    emoji: '💜', cor: '#8B5CF6' },
  { name: 'Santander', emoji: '🔴', cor: '#EC0000' },
  { name: 'Itaú',      emoji: '🔷', cor: '#003D7C' },
  { name: 'Inter',     emoji: '🟠', cor: '#FF6600' },
  { name: 'Bradesco',  emoji: '🔵', cor: '#CC092F' },
  { name: 'Caixa',     emoji: '🟢', cor: '#005CA9' },
  { name: 'C6 Bank',   emoji: '⚫', cor: '#222222' },
  { name: '99Pay',     emoji: '🟡', cor: '#F7C42A' },
  { name: 'Outro',     emoji: '🏦', cor: '#6366f1' },
]

type Step = 'bank' | 'upload' | 'analyzing' | 'results'

interface ExtractedTx {
  data: string
  descricao: string
  contraparte: string | null
  valor: number
  tipo: string
  categoria: string
  selected: boolean
}

interface AnalysisResult {
  tipoTela: string
  saldo: number | null
  faturaAtual: number | null
  limiteDisponivel: number | null
  dataVencimento: string | null
  transacoes: ExtractedTx[]
}

export default function IAExtratoPage() {
  const [step, setStep] = useState<Step>('bank')
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null)
  const [customBank, setCustomBank] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getProfiles(), getCategories()]).then(([p, c]) => {
      setProfiles(p)
      setCategories(c)
      if (p.length) setSelectedProfile(p[0].id)
    })
  }, [])

  const effectiveBank = selectedBank?.name === 'Outro' && customBank.trim()
    ? { name: customBank.trim(), emoji: '🏦', cor: '#6366f1' }
    : selectedBank

  // File handling
  function handleFile(file: File) {
    const mimeType = file.type || 'image/jpeg'
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setPreview(dataUrl)
      setFileData({ base64, mimeType })
    }
    reader.readAsDataURL(file)
  }

  // Analyze
  async function analyze() {
    if (!fileData || !effectiveBank) return
    setStep('analyzing')
    setError('')

    try {
      const res = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image: fileData.base64,
          mimeType: fileData.mimeType,
          bankName: effectiveBank.name,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na análise')

      setResult({
        ...data,
        transacoes: (data.transacoes || []).map((tx: any) => ({ ...tx, selected: true })),
      })
      setStep('results')
    } catch (err: any) {
      setError(err.message)
      setStep('upload')
    }
  }

  // Save selected transactions
  async function saveTransactions() {
    if (!result || !profiles.length) return
    const profile = profiles.find(p => p.id === selectedProfile) || profiles[0]
    const selected = result.transacoes.filter(tx => tx.selected)
    if (!selected.length) return

    setSaving(true)
    try {
      for (const tx of selected) {
        const [d, m] = (tx.data || '').split('/').map(Number)
        const year = new Date().getFullYear()
        const date = m && d ? `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : new Date().toISOString().slice(0, 10)

        const catMap: Record<string, string> = {}
        categories.forEach(c => {
          const key = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          catMap[key] = c.id
        })

        const matchCat = catMap[tx.categoria] || null

        await createTransaction({
          account_id: profile.account_id,
          profile_id: profile.id,
          type: tx.valor >= 0 ? 'income' : 'expense',
          description: [tx.descricao, tx.contraparte].filter(Boolean).join(' - '),
          amount: Math.abs(tx.valor),
          date,
          month_ref: monthRefFromDate(date),
          category_id: matchCat,
          source: 'bank_sync',
          notes: `Extraído via IA - ${effectiveBank?.name}`,
          tags: ['ia-extrato'],
        } as any)
      }
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  function toggleTx(idx: number) {
    if (!result) return
    const txs = [...result.transacoes]
    txs[idx] = { ...txs[idx], selected: !txs[idx].selected }
    setResult({ ...result, transacoes: txs })
  }

  function reset() {
    setStep('bank')
    setSelectedBank(null)
    setCustomBank('')
    setPreview(null)
    setFileData(null)
    setResult(null)
    setError('')
    setSaved(false)
  }

  const selectedCount = result?.transacoes.filter(t => t.selected).length ?? 0

  return (
    <div className="min-h-screen bg-surface-page">
      <Sidebar />
      <main className="md:ml-[240px] pb-24 md:pb-6">
        <div className="p-4 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-5 md:space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            {step !== 'bank' && (
              <button onClick={reset} className="w-9 h-9 rounded-xl bg-surface-input flex items-center justify-center border border-surface-border">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-fg flex items-center gap-2">
                <Sparkles size={20} className="text-brand-500" /> IA Extrato
              </h1>
              <p className="text-fg-muted text-sm">Extraia transações de prints bancários com IA</p>
            </div>
          </div>

          {/* ── STEP 1: Bank selection ── */}
          {step === 'bank' && (
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-base font-bold text-fg mb-4">De qual banco é o print?</h2>
                <div className="grid grid-cols-3 gap-2.5">
                  {BANKS.map(bank => (
                    <button key={bank.name} onClick={() => { setSelectedBank(bank); setCustomBank('') }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        selectedBank?.name === bank.name
                          ? 'border-brand-500 bg-blue-50'
                          : 'border-surface-border bg-white hover:border-brand-200'
                      }`}>
                      <span className="text-2xl">{bank.emoji}</span>
                      <span className="text-xs font-semibold text-fg">{bank.name}</span>
                    </button>
                  ))}
                </div>

                {selectedBank?.name === 'Outro' && (
                  <input className="input mt-3" placeholder="Nome do banco..."
                    value={customBank} onChange={e => setCustomBank(e.target.value)} />
                )}
              </div>

              <button onClick={() => setStep('upload')}
                disabled={!effectiveBank}
                className="btn-primary w-full">
                Continuar
              </button>
            </div>
          )}

          {/* ── STEP 2: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="card text-center space-y-4">
                <div className="text-3xl">{effectiveBank?.emoji}</div>
                <h2 className="text-base font-bold text-fg">{effectiveBank?.name}</h2>
                <p className="text-sm text-fg-muted">Envie uma screenshot do extrato, fatura ou tela inicial do app</p>

                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-surface-border">
                    <img src={preview} alt="Preview" className="w-full max-h-[300px] object-contain bg-surface-input" />
                    <button onClick={() => { setPreview(null); setFileData(null) }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-brand-200 rounded-xl bg-blue-50/50 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors">
                    <Camera size={32} className="text-brand-500" />
                    <span className="text-sm font-semibold text-brand-500">Escolher imagem</span>
                    <span className="text-xs text-fg-muted">PNG, JPG ou screenshot</span>
                  </button>
                )}

                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button onClick={analyze} disabled={!fileData} className="btn-primary w-full">
                <Sparkles size={16} /> Analisar com IA
              </button>
            </div>
          )}

          {/* ── STEP 3: Analyzing ── */}
          {step === 'analyzing' && (
            <div className="card text-center py-16 space-y-4">
              <Loader2 size={48} className="text-brand-500 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-fg">Analisando print...</h2>
              <p className="text-sm text-fg-muted">A IA está extraindo as transações do {effectiveBank?.name}</p>
            </div>
          )}

          {/* ── STEP 4: Results ── */}
          {step === 'results' && result && !saved && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="card" style={{ background: `linear-gradient(135deg, ${effectiveBank?.cor}15, ${effectiveBank?.cor}05)` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{effectiveBank?.emoji}</span>
                  <div>
                    <h2 className="text-base font-bold text-fg">{effectiveBank?.name}</h2>
                    <p className="text-xs text-fg-muted capitalize">{result.tipoTela || 'Extrato'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {result.saldo != null && (
                    <div className="bg-white rounded-xl p-3 border border-surface-border">
                      <p className="text-[10px] font-bold text-fg-muted uppercase">Saldo</p>
                      <p className="text-sm font-bold text-fg">{formatCurrency(result.saldo)}</p>
                    </div>
                  )}
                  {result.faturaAtual != null && (
                    <div className="bg-white rounded-xl p-3 border border-surface-border">
                      <p className="text-[10px] font-bold text-fg-muted uppercase">Fatura</p>
                      <p className="text-sm font-bold text-red-500">{formatCurrency(result.faturaAtual)}</p>
                    </div>
                  )}
                  {result.limiteDisponivel != null && (
                    <div className="bg-white rounded-xl p-3 border border-surface-border">
                      <p className="text-[10px] font-bold text-fg-muted uppercase">Limite disp.</p>
                      <p className="text-sm font-bold text-fg">{formatCurrency(result.limiteDisponivel)}</p>
                    </div>
                  )}
                  {result.dataVencimento && (
                    <div className="bg-white rounded-xl p-3 border border-surface-border">
                      <p className="text-[10px] font-bold text-fg-muted uppercase">Vencimento</p>
                      <p className="text-sm font-bold text-fg">{result.dataVencimento}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions */}
              {result.transacoes.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-fg">{result.transacoes.length} transações encontradas</h3>
                    <button onClick={() => {
                      const allSelected = result.transacoes.every(t => t.selected)
                      setResult({
                        ...result,
                        transacoes: result.transacoes.map(t => ({ ...t, selected: !allSelected })),
                      })
                    }} className="text-xs font-semibold text-brand-500">
                      {result.transacoes.every(t => t.selected) ? 'Desmarcar tudo' : 'Selecionar tudo'}
                    </button>
                  </div>

                  <div className="divide-y divide-surface-border">
                    {result.transacoes.map((tx, i) => (
                      <button key={i} onClick={() => toggleTx(i)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          tx.selected ? 'bg-white' : 'bg-surface-input/50 opacity-50'
                        }`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          tx.selected ? 'bg-brand-500 border-brand-500' : 'border-surface-border'
                        }`}>
                          {tx.selected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-fg truncate">
                            {tx.descricao}{tx.contraparte ? ` - ${tx.contraparte}` : ''}
                          </p>
                          <p className="text-xs text-fg-muted">{tx.data} • {tx.categoria}</p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${
                          tx.valor >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {tx.valor >= 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.valor))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile select */}
              {profiles.length > 1 && (
                <div className="card">
                  <label className="label">Salvar como</label>
                  <select className="input" value={selectedProfile}
                    onChange={e => setSelectedProfile(e.target.value)}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1">Nova análise</button>
                <button onClick={saveTransactions} disabled={saving || selectedCount === 0}
                  className="btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Salvando...' : `Salvar ${selectedCount} transações`}
                </button>
              </div>
            </div>
          )}

          {/* ── Saved confirmation ── */}
          {saved && (
            <div className="card text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-fg">Transações salvas!</h2>
              <p className="text-sm text-fg-muted">
                {selectedCount} transações do {effectiveBank?.name} foram adicionadas ao seu extrato
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="btn-secondary flex-1">Novo print</button>
                <a href="/transacoes" className="btn-primary flex-1 text-center">Ver transações</a>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
