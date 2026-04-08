'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('Verifique seu email para confirmar o cadastro.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou senha incorretos.')
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: '#1F0A1D',
        backgroundImage: `
          radial-gradient(ellipse 50% 40% at 60% 30%, rgba(69, 147, 108, 0.06), transparent),
          radial-gradient(ellipse 40% 50% at 20% 70%, rgba(51, 79, 83, 0.08), transparent)
        `,
      }}>

      {/* Ambient glow */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-[0.035] animate-pulse-soft"
        style={{ background: 'radial-gradient(circle, #9ACC77, transparent 70%)' }} />
      <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-[0.025] animate-pulse-soft"
        style={{ background: 'radial-gradient(circle, #334F53, transparent 70%)', animationDelay: '1.5s' }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #45936C 0%, #9ACC77 100%)',
              boxShadow: '0 8px 32px rgba(69, 147, 108, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gastos Pessoais</h1>
          <p className="text-fg-faint text-sm font-medium mt-2">Sistema financeiro multiusuario</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <h2 className="text-lg font-bold text-white mb-6">
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <div className="text-sm font-medium p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm font-medium p-3 rounded-xl"
                style={{ background: 'rgba(69,147,108,0.08)', color: '#9ACC77', border: '1px solid rgba(69,147,108,0.15)' }}>
                {message}
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-center" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aguarde...
                </span>
              ) : isSignUp ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-fg-faint mt-5 font-medium">
            {isSignUp ? 'Ja tem conta?' : 'Nao tem conta?'}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="font-bold text-brand-400 hover:text-white">
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
