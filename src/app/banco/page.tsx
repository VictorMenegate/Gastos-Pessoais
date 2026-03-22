'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Link, CheckCircle2, AlertCircle, Landmark } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getProfiles } from '@/lib/queries'
import type { Profile } from '@/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: 'DEBIT' | 'CREDIT'
}

export default function BancoPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState('')
  const [imported, setImported] = useState(0)
  const [itemId, setItemId] = useState('')
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    getProfiles().then(p => {
      setProfiles(p)
      if (p.length) setSelectedProfile(p[0].id)
    })
    const saved = localStorage.getItem('pluggy_item_id')
    if (saved) setItemId(saved)

    // Carrega SDK Pluggy Connect
    const script = document.createElement('script')
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.2.0/pluggy-connect.js'
    script.onload = () => setSdkLoaded(true)
    document.head.appendChild(script)
  }, [])

  async function openPluggyConnect() {
    setStatus('Carregando widget...')
    try {
      const res = await fetch('/api/pluggy/auth')
      const data = await res.json()
      if (!data.apiKey) throw new Error('Erro ao obter token')

      // @ts-ignore
      const pluggyConnect = new PluggyConnect({
        connectToken: data.apiKey,
        onSuccess: async (itemData: any) => {
          const id = itemData.item?.id || itemData.id
          if (id) {
            localStorage.setItem('pluggy_item_id', id)
            setItemId(id)
            setStatus('✅ Conta conectada! Sincronizando...')
            await syncTransactions(id)
          }
        },
        onError: (err: any) => setStatus(`❌ Erro: ${err.message}`),
        onClose: () => setStatus(''),
      })
      pluggyConnect.init()
    } catch (e: any) {
      setStatus(`❌ ${e.message}`)
    }
  }

  async function syncTransactions(id?: string) {
    const iid = id || itemId
    if (!iid) { setStatus('Conecte uma conta primeiro'); return }
    if (!selectedProfile) { setStatus('Selecione um perfil'); return }
    setSyncing(true)
    setStatus('Sincronizando transações...')
    try {
      const res = await fetch(`/api/pluggy/sync?itemId=${iid}&profileId=${selectedProfile}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.transactions) setTransactions(data.transactions)
      if (data.imported !== undefined) setImported(data.imported)
      setStatus(`✅ ${data.imported} gastos e entradas importados dos últimos 90 dias!`)
    } catch (e: any) {
      setStatus(`❌ Erro: ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Landmark size={20} className="text-green-400" /> Banco
            </h1>
            <p className="text-slate-400 text-sm">Conecte o C6 Bank e importe transações automaticamente</p>
          </div>

          {/* Perfil */}
          <div className="card">
            <label className="label">Importar para o perfil</label>
            <select className="input" value={selectedProfile}
              onChange={e => setSelectedProfile(e.target.value)}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Conexão */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Conta bancária</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {itemId
                    ? `✓ Conectado · ${itemId.slice(0, 8)}...`
                    : 'Nenhuma conta conectada'}
                </p>
              </div>
              {itemId
                ? <CheckCircle2 size={20} className="text-green-400" />
                : <AlertCircle size={20} className="text-amber-400" />
              }
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={openPluggyConnect}
                className="btn-primary flex items-center gap-2">
                <Link size={16} />
                {itemId ? 'Reconectar conta' : 'Conectar C6 Bank'}
              </button>
              {itemId && (
                <button onClick={() => syncTransactions()} disabled={syncing}
                  className="btn-secondary flex items-center gap-2">
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              )}
            </div>

            {status && (
              <p className={`text-sm px-3 py-2 rounded-lg border ${
                status.startsWith('✅')
                  ? 'bg-green-900/30 text-green-400 border-green-800'
                  : status.startsWith('❌')
                  ? 'bg-red-900/30 text-red-400 border-red-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>{status}</p>
            )}
          </div>

          {/* Transações */}
          {transactions.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Transações importadas</h2>
                <span className="badge-paid">{imported} salvas</span>
              </div>
              <div className="space-y-1">
                {transactions.slice(0, 30).map(tx => (
                  <div key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description}</p>
                      <p className="text-xs text-slate-400">{tx.date}</p>
                    </div>
                    <p className={`text-sm font-semibold ml-3 flex-shrink-0 ${
                      tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Como funciona */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Como funciona</h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li>• Clique em "Conectar C6 Bank" e faça login com suas credenciais</li>
              <li>• Gastos (débitos) são importados automaticamente na página de Gastos</li>
              <li>• Entradas (créditos) aparecem na página de Entradas</li>
              <li>• Sincronize a qualquer momento para puxar novos lançamentos</li>
              <li>• Conexão segura via Open Finance — Pluggy não armazena suas senhas</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
