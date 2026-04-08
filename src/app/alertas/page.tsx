'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { getAlerts, markAlertRead, markAllAlertsRead } from '@/lib/queries'
import { formatDate } from '@/lib/utils'
import { ALERT_SEVERITY_CONFIG } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import type { Alert } from '@/types'

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-56 pb-24 md:pb-6">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Alertas</h1>
              <p className="text-fg-muted text-sm">{unreadCount} não lido(s)</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-1.5 text-sm">
                <CheckCheck size={16} /> Marcar todas como lidas
              </button>
            )}
          </div>

          {loading ? <Loading /> : alerts.length === 0 ? (
            <EmptyState icon="🔔" title="Nenhum alerta" description="Tudo tranquilo por aqui" />
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => {
                const config = ALERT_SEVERITY_CONFIG[alert.severity]
                return (
                  <div key={alert.id}
                    className={`card flex items-start gap-3 ${!alert.read ? 'border-l-2' : 'opacity-60'}`}
                    style={{ borderLeftColor: !alert.read ? (
                      alert.severity === 'danger' ? '#ef4444' :
                      alert.severity === 'warning' ? '#f59e0b' :
                      alert.severity === 'success' ? '#9ACC77' : '#3b82f6'
                    ) : undefined }}
                    onClick={() => !alert.read && handleMarkRead(alert.id)}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${alert.read ? 'text-fg-muted' : 'text-white'}`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-fg-muted mt-0.5">{alert.message}</p>
                      <p className="text-xs text-fg-faint mt-1">{formatDate(alert.created_at, "dd/MM 'às' HH:mm")}</p>
                    </div>
                    {!alert.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
