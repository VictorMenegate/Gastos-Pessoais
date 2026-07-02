'use client'

import { createClient } from '@/lib/supabase/client'
import { Clock } from 'lucide-react'

export default function PendentePage() {
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, var(--accent-dark) 0%, var(--accent) 40%, var(--accent-light) 100%)' }}>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 bg-white/20 backdrop-blur-sm">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Conta em análise</h1>
        <p className="text-white/80 text-sm mb-6">Seu cadastro foi recebido e está aguardando aprovação.</p>

        <div className="bg-white rounded-2xl p-7 shadow-xl text-left">
          <p className="text-sm text-gray-600 leading-relaxed">
            Assim que o administrador aprovar seu acesso, você poderá entrar normalmente.
            Se já foi aprovado, clique em <span className="font-semibold">Atualizar</span>.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => window.location.reload()} className="btn-primary flex-1">Atualizar</button>
            <button onClick={sair} className="btn-secondary flex-1">
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
