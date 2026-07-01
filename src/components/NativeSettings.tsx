'use client'

import { useEffect, useState } from 'react'
import { Fingerprint, Bell } from 'lucide-react'
import {
  isNative,
  biometricAvailable,
  biometricVerify,
  registerPush,
  getPlatform,
  BIOMETRIC_LOCK_KEY,
  PUSH_ENABLED_KEY,
} from '@/lib/native'
import { savePushToken } from '@/lib/queries'

/**
 * Configurações que só fazem sentido no app (APK). Renderiza null na web.
 * Preferências ficam em localStorage (nível de dispositivo).
 */
export default function NativeSettings() {
  const [show, setShow] = useState(false)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioOn, setBioOn] = useState(false)
  const [pushOn, setPushOn] = useState(false)

  useEffect(() => {
    if (!isNative()) return
    setShow(true)
    try {
      setBioOn(localStorage.getItem(BIOMETRIC_LOCK_KEY) === '1')
      setPushOn(localStorage.getItem(PUSH_ENABLED_KEY) === '1')
    } catch {}
    biometricAvailable().then(setBioAvailable)
  }, [])

  async function toggleBio(next: boolean) {
    if (next) {
      // Confirma que consegue autenticar antes de ativar o bloqueio
      const ok = await biometricVerify('Confirme para ativar o bloqueio')
      if (!ok) return
    }
    setBioOn(next)
    try {
      localStorage.setItem(BIOMETRIC_LOCK_KEY, next ? '1' : '0')
    } catch {}
  }

  async function togglePush(next: boolean) {
    setPushOn(next)
    try {
      localStorage.setItem(PUSH_ENABLED_KEY, next ? '1' : '0')
    } catch {}
    if (next) {
      await registerPush((token) => {
        try {
          localStorage.setItem('gastos:push_token', token)
        } catch {}
        savePushToken(token, getPlatform()).catch(() => {})
      })
    }
  }

  if (!show) return null

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-fg">Segurança e Notificações</h2>

      <label className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-fg">
          <Fingerprint size={16} className="text-brand-500" />
          Bloqueio biométrico
        </span>
        <input
          type="checkbox"
          className="w-5 h-5 accent-brand-500"
          disabled={!bioAvailable}
          checked={bioOn}
          onChange={(e) => toggleBio(e.target.checked)}
        />
      </label>
      {!bioAvailable && (
        <p className="text-xs text-fg-muted -mt-2">Biometria não disponível neste aparelho.</p>
      )}

      <label className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-fg">
          <Bell size={16} className="text-brand-500" />
          Notificações push
        </span>
        <input
          type="checkbox"
          className="w-5 h-5 accent-brand-500"
          checked={pushOn}
          onChange={(e) => togglePush(e.target.checked)}
        />
      </label>
    </div>
  )
}
