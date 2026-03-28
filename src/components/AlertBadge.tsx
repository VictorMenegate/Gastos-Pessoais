'use client'

import { ALERT_SEVERITY_CONFIG } from '@/lib/constants'
import type { AlertSeverity } from '@/types'

interface Props {
  severity: AlertSeverity
  children: React.ReactNode
}

export default function AlertBadge({ severity, children }: Props) {
  const config = ALERT_SEVERITY_CONFIG[severity]
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.bg} ${config.text} border ${config.border} px-2 py-0.5 rounded-full`}>
      {config.icon} {children}
    </span>
  )
}
