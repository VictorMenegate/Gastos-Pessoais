'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [convite, setConvite] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  // Link de convite: /login?convite=CODIGO abre direto no cadastro com o código preenchido
  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get('convite')
    if (codigo) {
      setConvite(codigo)
      setIsSignUp(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const codigo = convite.trim()

      // Valida o convite antes de criar o usuário
      if (codigo) {
        const { data: valido } = await supabase.rpc('convite_valido', { p_codigo: codigo })
        if (valido !== true) {
          setError('Código de convite inválido. Confira o link ou deixe em branco para criar uma conta nova.')
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        if (codigo && data.session) {
          // Entra na conta de quem convidou (cria perfil + aprova acesso)
          await supabase.rpc('entrar_com_convite', {
            p_codigo: codigo,
            p_nome: nome.trim() || email.split('@')[0],
          })
        }
        window.location.href = '/dashboard'
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou senha incorretos.')
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 50%, var(--accent) 100%)' }}>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 bg-white/20 backdrop-blur-sm overflow-hidden">
            <Image src="/moeda.png" alt="Gastos Pessoais" width={56} height={56} className="object-contain translate-y-0.5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gastos Pessoais</h1>
          <p className="text-white/60 text-sm font-medium mt-2">Sistema financeiro multiusuario</p>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-xl">
          <h2 className="text-lg font-bold text-fg mb-6">
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </h2>

          {isSignUp && convite && (
            <div className="text-sm font-medium p-3 rounded-xl bg-green-50 text-green-700 border border-green-200 mb-5">
              Você foi convidado! Crie sua conta para entrar na família.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="label">Seu nome</label>
                <input type="text" className="input" placeholder="Victor, Ana..."
                  value={nome} onChange={e => setNome(e.target.value)} />
              </div>
            )}
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
            {isSignUp && (
              <div>
                <label className="label">Código de convite (opcional)</label>
                <input type="text" className="input font-mono" placeholder="Recebeu um convite? Cole aqui"
                  value={convite} onChange={e => setConvite(e.target.value)} />
              </div>
            )}

            {error && (
              <div className="text-sm font-medium p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm font-medium p-3 rounded-xl bg-blue-50 text-brand-500 border border-blue-200">
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

          <p className="text-center text-sm text-fg-muted mt-5 font-medium">
            {isSignUp ? 'Ja tem conta?' : 'Nao tem conta?'}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="font-bold text-brand-500 hover:text-brand-400">
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
