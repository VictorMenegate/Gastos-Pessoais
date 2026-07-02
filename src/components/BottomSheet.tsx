'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/lib/useMediaQuery'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Desktop: 'inline-card' embrulha em .card com título (padrão das páginas);
   *  'bare' renderiza só o children (TransactionForm/ExtratoUpload têm card próprio) */
  desktopMode?: 'inline-card' | 'bare'
  children: React.ReactNode
}

// Mobile (<768px): painel que desliza de baixo com backdrop, via portal no body
// (position:fixed dentro de ancestral com transform do anime.js quebraria).
// Desktop (md+): mantém o comportamento inline atual — desktop intocado.
export default function BottomSheet({ open, onClose, title, desktopMode = 'inline-card', children }: BottomSheetProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [closing, setClosing] = useState(false)

  // Trava o scroll do fundo enquanto o sheet está aberto
  useEffect(() => {
    if (!open || !isMobile) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [open, isMobile])

  function fechar() {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 200)
  }

  if (!open) return null

  if (!isMobile) {
    if (desktopMode === 'bare') return <>{children}</>
    return (
      <div className="card border-brand-200">
        {title && <h2 className="text-sm font-semibold text-fg mb-4">{title}</h2>}
        {children}
      </div>
    )
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/25 backdrop-blur-[2px] ${closing ? 'opacity-0' : 'animate-backdrop-in'}`}
        style={closing ? { transition: 'opacity 200ms ease' } : undefined}
        onClick={fechar}
      />
      <div className={`fixed inset-x-0 bottom-0 z-[75] ${closing ? 'animate-sheet-out' : 'animate-sheet-in'}`}
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
        }}>
        <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mt-3" />
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <h2 className="text-base font-bold text-fg">{title}</h2>
          <button onClick={fechar} aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-fg-secondary">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[82dvh] overflow-y-auto overscroll-contain px-5 pt-2"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
