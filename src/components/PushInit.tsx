'use client'

import { useEffect } from 'react'
import { isNative, registerPush, getPlatform, PUSH_ENABLED_KEY } from '@/lib/native'
import { savePushToken } from '@/lib/queries'

/**
 * Inicializa push notifications no APK quando o usuário ativou nas Configurações.
 * No-op na web e quando o Firebase (google-services.json) não está configurado.
 * O token é guardado em localStorage — o envio efetivo depende do backend/Firebase
 * (ver docs/MOBILE.md).
 */
export default function PushInit() {
  useEffect(() => {
    if (!isNative()) return
    try {
      if (localStorage.getItem(PUSH_ENABLED_KEY) !== '1') return
    } catch {
      return
    }
    registerPush((token) => {
      try {
        localStorage.setItem('gastos:push_token', token)
      } catch {}
      savePushToken(token, getPlatform()).catch(() => {})
    })
  }, [])

  return null
}
