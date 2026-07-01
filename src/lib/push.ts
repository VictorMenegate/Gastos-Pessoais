/**
 * Envio de push via Firebase Cloud Messaging (HTTP v1).
 * Server-side apenas (usa credenciais da service account).
 *
 * Ativação: definir as env vars abaixo (do google-services / service account do Firebase):
 *   FCM_PROJECT_ID     — id do projeto Firebase
 *   FCM_CLIENT_EMAIL   — client_email da service account
 *   FCM_PRIVATE_KEY    — private_key da service account (com \n escapados)
 *
 * Sem essas vars, as funções fazem no-op seguro (retornam sem enviar).
 * Não adiciona dependências: o access token é gerado assinando um JWT com `crypto`.
 */
import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

function config() {
  const projectId = process.env.FCM_PROJECT_ID
  const clientEmail = process.env.FCM_CLIENT_EMAIL
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return null
  return { projectId, clientEmail, privateKey }
}

export function pushConfigured(): boolean {
  return config() !== null
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Gera um access token OAuth2 a partir da service account (JWT bearer). */
async function getAccessToken(): Promise<string | null> {
  const cfg = config()
  if (!cfg) return null

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: cfg.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const signingInput = `${header}.${claim}`
  const signature = base64url(crypto.sign('RSA-SHA256', Buffer.from(signingInput), cfg.privateKey))
  const jwt = `${signingInput}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

/** Envia uma notificação para uma lista de tokens FCM. */
export async function sendPushToTokens(
  tokens: string[],
  notif: { title: string; body: string },
): Promise<void> {
  const cfg = config()
  if (!cfg || !tokens.length) return
  const accessToken = await getAccessToken()
  if (!accessToken) return

  const url = `https://fcm.googleapis.com/v1/projects/${cfg.projectId}/messages:send`
  await Promise.allSettled(
    tokens.map((token) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: notif.title, body: notif.body },
            android: { notification: { icon: 'ic_launcher', color: '#16a34a' } },
          },
        }),
      }),
    ),
  )
}

/** Busca os tokens de uma conta e envia o push. Usa client com service role. */
export async function sendPushToAccount(
  supabase: SupabaseClient,
  accountId: string,
  notif: { title: string; body: string },
): Promise<void> {
  if (!pushConfigured()) return
  const { data } = await supabase.from('push_tokens').select('token').eq('account_id', accountId)
  const tokens = (data ?? []).map((r: { token: string }) => r.token)
  await sendPushToTokens(tokens, notif)
}
