/**
 * Helpers para recursos nativos (Capacitor).
 * Todas as funções são seguras na web: no navegador `isNative()` é false
 * e as chamadas nativas fazem no-op / retornam valores neutros.
 * Os plugins são importados dinamicamente para não quebrar SSR/web build.
 */
import { Capacitor } from '@capacitor/core'

export const isNative = (): boolean => Capacitor.isNativePlatform()
export const getPlatform = (): string => Capacitor.getPlatform()

export const BIOMETRIC_LOCK_KEY = 'gastos:biometric_lock'
export const PUSH_ENABLED_KEY = 'gastos:push_enabled'

/** Abre a câmera nativa e retorna a foto em base64 (mesmo formato usado no upload de extrato). */
export async function takePhoto(): Promise<{ base64: string; mimeType: string } | null> {
  if (!isNative()) return null
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
  })
  if (!photo.base64String) return null
  return { base64: photo.base64String, mimeType: `image/${photo.format || 'jpeg'}` }
}

/** Indica se o aparelho tem biometria disponível (digital/face). */
export async function biometricAvailable(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
    const info = await BiometricAuth.checkBiometry()
    return info.isAvailable
  } catch {
    return false
  }
}

/** Solicita autenticação biométrica. Retorna true se autenticou. */
export async function biometricVerify(reason = 'Desbloqueie o Gastos'): Promise<boolean> {
  if (!isNative()) return true
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancelar',
      allowDeviceCredential: true,
      androidTitle: 'Gastos',
      androidSubtitle: 'Autenticação necessária',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Registra o dispositivo para push e devolve o token FCM via callback.
 * IMPORTANTE: só funciona no APK com google-services.json configurado (Firebase).
 * Sem Firebase, register() falha e a função apenas ignora (no-op seguro).
 */
export async function registerPush(onToken: (token: string) => void): Promise<void> {
  if (!isNative()) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') return
    await PushNotifications.addListener('registration', (t) => onToken(t.value))
    await PushNotifications.register()
  } catch {
    // Firebase não configurado ou plugin indisponível — ignora.
  }
}
