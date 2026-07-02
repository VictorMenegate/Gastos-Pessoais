'use client'

import Sidebar from './Sidebar'

interface PageShellProps {
  /** PageHero (mobile) — renderizado full-bleed, antes do container com padding */
  hero?: React.ReactNode
  /** Conteúdo sobrepõe o hero em -mt-14 (padrão do dashboard); use com PageHero overlap */
  overlap?: boolean
  maxWidth?: 'max-w-5xl' | 'max-w-6xl'
  children: React.ReactNode
}

// Wrapper padrão das páginas internas: Sidebar + área de conteúdo.
// Mobile: fundo transparente (deixa o gradiente pastel do body aparecer).
// Desktop: mantém o painel branco arredondado atual.
export default function PageShell({ hero, overlap = false, maxWidth = 'max-w-6xl', children }: PageShellProps) {
  return (
    <div className="min-h-screen md:bg-[var(--bg-page)]">
      <Sidebar />
      <main className="md:ml-[240px] pb-24 md:pb-6 md:py-3 md:pr-3">
        <div className="md:bg-white md:min-h-[calc(100vh-24px)] md:overflow-auto" style={{ borderRadius: 'var(--content-radius, 0)' }}>
          {hero}
          <div className={`p-4 md:p-8 lg:p-10 space-y-4 md:space-y-6 ${maxWidth} mx-auto ${overlap ? '-mt-14 md:mt-0 relative z-10' : ''}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
