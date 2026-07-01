'use client'

import { useEffect, useState, useCallback } from 'react'
import { Fingerprint } from 'lucide-react'
import { isNative, biometricAvailable, biometricVerify, BIOMETRIC_LOCK_KEY } from '@/lib/native'

/**
 * Envolve o app e exige autenticação biométrica quando o "bloqueio biométrico"
 * está ativado (localStorage) e há biometria disponível no aparelho.
 * Na web é sempre transparente (isNative() === false).
 */
export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState(false)

  const isEnabled = () => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(BIOMETRIC_LOCK_KEY) === '1'
    } catch {
      return false
    }
  }

  const unlock = useCallback(async () => {
    setBusy(true)
    const ok = await biometricVerify()
    setBusy(false)
    if (ok) setLocked(false)
  }, [])

  useEffect(() => {
    let mounted = true
    let removeListener: (() => void) | undefined

    ;(async () => {
      if (!isNative() || !isEnabled() || !(await biometricAvailable())) return
      if (!mounted) return
      setLocked(true)
      const ok = await biometricVerify()
      if (mounted && ok) setLocked(false)

      // Re-bloqueia quando o app volta do background
      const { App } = await import('@capacitor/app')
      const handle = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && isEnabled()) setLocked(true)
      })
      removeListener = () => handle.remove()
    })()

    return () => {
      mounted = false
      removeListener?.()
    }
  }, [])

  return (
    <>
      {children}
      {locked && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#0f172a] text-white px-8">
          <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center">
            <Fingerprint size={40} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold">Gastos bloqueado</h2>
            <p className="text-sm text-white/60">Autentique-se para continuar</p>
          </div>
          <button
            onClick={unlock}
            disabled={busy}
            className="px-6 py-3 rounded-2xl bg-[#16a34a] font-semibold disabled:opacity-60"
          >
            {busy ? 'Verificando...' : 'Desbloquear'}
          </button>
        </div>
      )}
    </>
  )
}
