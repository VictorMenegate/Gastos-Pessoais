'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Check, Loader2, Sparkles, FileText, Upload } from 'lucide-react'
import { createTransaction, getProfiles, getCategories } from '@/lib/queries'
import { formatCurrency, monthRefFromDate } from '@/lib/utils'
import type { Profile, Category } from '@/types'

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

type Step = 'upload' | 'analyzing' | 'results'

interface ExtratoUploadProps {
  onClose: () => void
  onSaved: () => void
}

export default function ExtratoUpload({ onClose, onSaved }: ExtratoUploadProps) {
  const [step, setStep] = useState<Step>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
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

  async function handleFile(file: File) {
    const mimeType = file.type || 'image/jpeg'

    if (mimeType === 'application/pdf') {
      setPdfName(file.name)
      setPreview(null)
      setFileData(null)
      setPdfBase64(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(',')[1]
        setPdfBase64(base64)
      }
      reader.readAsDataURL(file)
      return
    }

    setPdfName(null)
    setPdfBase64(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setPreview(dataUrl)
      setFileData({ base64, mimeType })
    }
    reader.readAsDataURL(file)
  }

  const hasFile = !!fileData || !!pdfBase64

  async function analyze() {
    if (!fileData && !pdfBase64) return
    setStep('analyzing')
    setError('')

    try {
      const body: any = {}
      if (pdfBase64) {
        body.pdfBase64 = pdfBase64
      } else if (fileData) {
        body.image = fileData.base64
        body.mimeType = fileData.mimeType
      }

      const res = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na analise')

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

  async function saveTransactions() {
    if (!result) return

    const profile = profiles.find(p => p.id === selectedProfile) || profiles[0]
    if (!profile) {
      setError('Nenhum perfil encontrado. Configure um perfil primeiro.')
      return
    }
    if (!profile.account_id) {
      setError('Conta nao encontrada. Configure seu perfil em Configuracoes.')
      return
    }

    const selected = result.transacoes.filter(tx => tx.selected)
    if (!selected.length) {
      setError('Selecione pelo menos uma transacao')
      return
    }

    setSaving(true)
    setError('')

    try {
      const catMap: Record<string, string> = {}
      categories.forEach(c => {
        const key = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        catMap[key] = c.id
      })

      let savedCount = 0
      for (const tx of selected) {
        const [d, m] = (tx.data || '').split('/').map(Number)
        const year = new Date().getFullYear()
        const date = m && d
          ? `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          : new Date().toISOString().slice(0, 10)

        const amount = Math.abs(tx.valor)
        if (!amount || amount <= 0) continue

        await createTransaction({
          account_id: profile.account_id,
          profile_id: profile.id,
          type: tx.valor >= 0 ? 'income' : 'expense',
          description: [tx.descricao, tx.contraparte].filter(Boolean).join(' - '),
          amount,
          date,
          month_ref: monthRefFromDate(date),
          category_id: catMap[tx.categoria] || undefined,
          source: 'bank_sync',
          notes: 'Extraido via IA',
          tags: ['ia-extrato'],
        } as any)
        savedCount++
      }

      if (savedCount === 0) {
        setError('Nenhuma transacao valida para salvar')
        setSaving(false)
        return
      }

      setSaved(true)
      onSaved()
    } catch (err: any) {
      setError('Erro ao salvar: ' + (err.message || 'Tente novamente'))
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
    setStep('upload')
    setPreview(null)
    setPdfName(null)
    setPdfBase64(null)
    setFileData(null)
    setResult(null)
    setError('')
    setSaved(false)
  }

  function clearFile() {
    setPreview(null)
    setPdfName(null)
    setPdfBase64(null)
    setFileData(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const selectedCount = result?.transacoes.filter(t => t.selected).length ?? 0

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-fg flex items-center gap-2">
          <Sparkles size={18} className="text-brand-500" /> IA Extrato
        </h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border-2 border-[var(--border)] hover:bg-surface-input transition-colors"
          style={{ borderRadius: '10px' }}>
          <X size={14} />
        </button>
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">Envie um print ou PDF do extrato para extrair transacoes com IA</p>

          {preview ? (
            <div className="relative overflow-hidden border-2 border-[var(--border)]" style={{ borderRadius: '14px' }}>
              <img src={preview} alt="Preview" className="w-full max-h-[250px] object-contain bg-surface-input" />
              <button onClick={clearFile}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow">
                <X size={14} />
              </button>
            </div>
          ) : pdfName ? (
            <div className="relative flex items-center gap-3 p-3 border-2 border-brand-300 bg-blue-50" style={{ borderRadius: '14px' }}>
              <FileText size={24} className="text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-fg truncate">{pdfName}</p>
                <p className="text-xs text-fg-muted">{pdfBase64 ? 'PDF pronto para analise' : 'Carregando...'}</p>
              </div>
              <button onClick={clearFile}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-10 border-2 border-dashed border-brand-200 bg-blue-50/50 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors"
              style={{ borderRadius: '14px' }}>
              <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <span className="text-sm font-bold text-fg">Escolher arquivo</span>
              <span className="text-xs text-fg-muted">Imagem (PNG, JPG) ou PDF</span>
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,.png,.jpg,.jpeg" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {error && (
            <div className="p-3 border-2 border-red-200 bg-red-50 text-sm text-red-600 font-medium" style={{ borderRadius: '12px' }}>
              {error}
            </div>
          )}

          <button onClick={analyze} disabled={!hasFile} className="btn-primary w-full flex items-center justify-center gap-2">
            <Sparkles size={16} /> Analisar com IA
          </button>
        </div>
      )}

      {/* STEP 2: Analyzing */}
      {step === 'analyzing' && (
        <div className="text-center py-10 space-y-3">
          <Loader2 size={40} className="text-brand-500 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-fg">Analisando...</h3>
          <p className="text-sm text-fg-muted">A IA esta extraindo as transacoes</p>
        </div>
      )}

      {/* STEP 3: Results */}
      {step === 'results' && result && !saved && (
        <div className="space-y-3">
          {/* Summary */}
          {(result.saldo != null || result.faturaAtual != null || result.limiteDisponivel != null || result.dataVencimento) && (
            <div className="grid grid-cols-2 gap-2">
              {result.saldo != null && (
                <div className="p-3 border-2 border-[var(--border)]" style={{ borderRadius: '12px' }}>
                  <p className="text-[10px] font-bold text-fg-muted uppercase">Saldo</p>
                  <p className="text-sm font-bold text-fg">{formatCurrency(result.saldo)}</p>
                </div>
              )}
              {result.faturaAtual != null && (
                <div className="p-3 border-2 border-[var(--border)]" style={{ borderRadius: '12px' }}>
                  <p className="text-[10px] font-bold text-fg-muted uppercase">Fatura</p>
                  <p className="text-sm font-bold text-red-500">{formatCurrency(result.faturaAtual)}</p>
                </div>
              )}
              {result.limiteDisponivel != null && (
                <div className="p-3 border-2 border-[var(--border)]" style={{ borderRadius: '12px' }}>
                  <p className="text-[10px] font-bold text-fg-muted uppercase">Limite disp.</p>
                  <p className="text-sm font-bold text-fg">{formatCurrency(result.limiteDisponivel)}</p>
                </div>
              )}
              {result.dataVencimento && (
                <div className="p-3 border-2 border-[var(--border)]" style={{ borderRadius: '12px' }}>
                  <p className="text-[10px] font-bold text-fg-muted uppercase">Vencimento</p>
                  <p className="text-sm font-bold text-fg">{result.dataVencimento}</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions */}
          {result.transacoes.length > 0 && (
            <div className="border-2 border-[var(--border)] overflow-hidden" style={{ borderRadius: '14px' }}>
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg">{result.transacoes.length} transacoes encontradas</h3>
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

              <div className="divide-y divide-surface-border max-h-[300px] overflow-y-auto">
                {result.transacoes.map((tx, i) => (
                  <button key={i} onClick={() => toggleTx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      tx.selected ? 'bg-white' : 'bg-surface-input/50 opacity-50'
                    }`}>
                    <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 border-2 ${
                      tx.selected ? 'bg-brand-500 border-brand-500' : 'border-[var(--border)]'
                    }`} style={{ borderRadius: '6px' }}>
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
            <div>
              <label className="label">Salvar como</label>
              <select className="input" value={selectedProfile}
                onChange={e => setSelectedProfile(e.target.value)}>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 border-2 border-red-200 bg-red-50 text-sm text-red-600 font-medium" style={{ borderRadius: '12px' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={reset} className="btn-secondary flex-1">Nova analise</button>
            <button onClick={saveTransactions} disabled={saving || selectedCount === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Salvando...' : `Salvar ${selectedCount}`}
            </button>
          </div>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <Check size={28} className="text-green-600" />
          </div>
          <h3 className="text-base font-bold text-fg">Transacoes salvas!</h3>
          <p className="text-sm text-fg-muted">
            {selectedCount} transacoes foram adicionadas
          </p>
          <div className="flex gap-2 pt-1">
            <button onClick={reset} className="btn-secondary flex-1">Novo extrato</button>
            <button onClick={onClose} className="btn-primary flex-1">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
