import { NextResponse } from 'next/server'

const PLUGGY_API = 'https://api.pluggy.ai'
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID!
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET!

export async function GET() {
  try {
    // Gera API key do Pluggy
    const authRes = await fetch(`${PLUGGY_API}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
    })
    const authData = await authRes.json()
    if (!authData.apiKey) throw new Error('Failed to get API key')

    // Gera connect token para o widget
    const tokenRes = await fetch(`${PLUGGY_API}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': authData.apiKey,
      },
      body: JSON.stringify({}),
    })
    const tokenData = await tokenRes.json()

    return NextResponse.json({ apiKey: tokenData.accessToken })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
