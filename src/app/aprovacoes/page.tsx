'use client'

import { useEffect, useState } from 'react'
import { Check, X, ShieldCheck, Clock } from 'lucide-react'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import { SkeletonList } from '@/components/Skeleton'

type AccessRequest = {
  user_id: string
  email: string | null
  approved: boolean
  is_admin: boolean
  created_at: string
}

export default function AprovacoesPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/access', { cache: 'no-store' })
    if (res.status === 403) { setForbidden(true); setLoading(false); return }
    const json = await res.json()
    setRequests(json.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setApproved(user_id: string, approved: boolean) {
    setSaving(user_id)
    await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, approved }),
    })
    await load()
    setSaving(null)
  }

  const pendentes = requests.filter(r => !r.approved)
  const aprovados = requests.filter(r => r.approved)

  const inner = forbidden ? (
    <div className="max-w-2xl">
      <div className="card p-6 text-center text-text-secondary">
        Você não tem permissão para acessar esta página.
      </div>
    </div>
  ) : (
    <div className="max-w-2xl">
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Aprovações de acesso</h1>
        <p className="text-text-secondary text-sm">Aprove ou bloqueie quem pode usar o app.</p>
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Pendentes ({pendentes.length})
            </h2>
            {pendentes.length === 0 ? (
              <div className="card p-5 text-text-secondary text-sm">Nenhum cadastro pendente. 🎉</div>
            ) : pendentes.map(r => (
              <div key={r.user_id} className="card p-4 mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.email || r.user_id}</div>
                  <div className="text-xs text-text-muted">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <button onClick={() => setApproved(r.user_id, true)} disabled={saving === r.user_id}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap px-4 py-2">
                  <Check className="w-4 h-4" /> Aprovar
                </button>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Aprovados ({aprovados.length})
            </h2>
            {aprovados.map(r => (
              <div key={r.user_id} className="card p-4 mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.email || r.user_id}
                    {r.is_admin && <span className="ml-2 text-xs font-semibold text-brand-500">admin</span>}
                  </div>
                  <div className="text-xs text-text-muted">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
                </div>
                {!r.is_admin && (
                  <button onClick={() => setApproved(r.user_id, false)} disabled={saving === r.user_id}
                    className="severity-danger flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Bloquear
                  </button>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )

  return (
    <PageShell
      hero={
        <PageHero
          title="Aprovações"
          subtitle="Aprove ou bloqueie quem pode usar o app"
          value={loading ? '—' : pendentes.length}
          valueLabel="pendentes"
          loading={loading}
        />
      }
    >
      {inner}
    </PageShell>
  )
}
