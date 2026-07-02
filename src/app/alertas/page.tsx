'use client'

import { useEffect, useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { getAlerts, markAlertRead, markAllAlertsRead } from '@/lib/queries'
import { formatDate } from '@/lib/utils'
import { ALERT_SEVERITY_CONFIG } from '@/lib/constants'
import PageShell from '@/components/PageShell'
import PageHero from '@/components/PageHero'
import EmptyState from '@/components/EmptyState'
import { SkeletonList } from '@/components/Skeleton'
import { useStaggerIn } from '@/lib/useAnime'
import type { Alert } from '@/types'

const CORES_SEVERIDADE: Record<Alert['severity'], string> = {
  danger: 'var(--red)',
  warning: 'var(--amber)',
  success: 'var(--green)',
  info: 'var(--info)',
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const listRef = useStaggerIn([loading])

  async function load() {
    setLoading(true)
    setAlerts(await getAlerts())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleMarkRead(id: string) {
    await markAlertRead(id)
    load()
  }

  async function handleMarkAllRead() {
    await markAllAlertsRead()
    load()
  }

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <PageShell
      hero={
        <PageHero
          title="Alertas"
          subtitle="Central de notificações"
          value={loading ? '—' : unreadCount}
          valueLabel="não lidos"
          loading={loading}
          actions={unreadCount > 0 ? (
            <button onClick={handleMarkAllRead} aria-label="Marcar todas como lidas"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCheck size={16} className="text-white" />
            </button>
          ) : undefined}
        />
      }
    >
      {/* Header desktop (mobile usa o hero) */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fg">Alertas</h1>
          <p className="text-fg-secondary text-sm">{unreadCount} não lido(s)</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-1.5 text-sm">
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? <SkeletonList rows={5} /> : alerts.length === 0 ? (
        <EmptyState icon="🔔" title="Nenhum alerta" description="Tudo tranquilo por aqui" />
      ) : (
        <div ref={listRef} className="space-y-2">
          {alerts.map(alert => {
            const config = ALERT_SEVERITY_CONFIG[alert.severity]
            return (
              <div key={alert.id}
                className={`card flex items-start gap-3 ${!alert.read ? 'border-l-2' : 'opacity-60'}`}
                style={{ borderLeftColor: !alert.read ? CORES_SEVERIDADE[alert.severity] : undefined }}
                onClick={() => !alert.read && handleMarkRead(alert.id)}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${alert.read ? 'text-fg-secondary' : 'text-fg'}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-fg-secondary mt-0.5">{alert.message}</p>
                  <p className="text-xs text-fg-muted mt-1">{formatDate(alert.created_at, "dd/MM 'às' HH:mm")}</p>
                </div>
                {!alert.read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--info)' }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
