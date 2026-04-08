'use client'

import { useState } from 'react'
import { Plus, X, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function FAB() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-50">
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10" onClick={() => setOpen(false)} />
      )}

      {/* Actions */}
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2 mb-2">
          <Link href="/transacoes?action=extrato" onClick={() => setOpen(false)}
            className="flex items-center gap-3 whitespace-nowrap animate-fab-item"
            style={{ animationDelay: '0ms' }}>
            <span className="bg-white shadow-lg text-fg text-sm font-semibold px-4 py-2.5 border-2 border-[var(--border)]"
              style={{ borderRadius: '14px' }}>
              Extrato IA
            </span>
            <div className="w-11 h-11 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
          </Link>

          <Link href="/transacoes?action=entrada" onClick={() => setOpen(false)}
            className="flex items-center gap-3 whitespace-nowrap animate-fab-item"
            style={{ animationDelay: '40ms' }}>
            <span className="bg-white shadow-lg text-fg text-sm font-semibold px-4 py-2.5 border-2 border-[var(--border)]"
              style={{ borderRadius: '14px' }}>
              Registrar entrada
            </span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
              <ArrowDownRight size={18} className="text-white" />
            </div>
          </Link>

          <Link href="/transacoes?action=gasto" onClick={() => setOpen(false)}
            className="flex items-center gap-3 whitespace-nowrap animate-fab-item"
            style={{ animationDelay: '80ms' }}>
            <span className="bg-white shadow-lg text-fg text-sm font-semibold px-4 py-2.5 border-2 border-[var(--border)]"
              style={{ borderRadius: '14px' }}>
              Adicionar gasto
            </span>
            <div className="w-11 h-11 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg">
              <ArrowUpRight size={18} className="text-white" />
            </div>
          </Link>
        </div>
      )}

      {/* Main button */}
      <button onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200"
        style={{
          background: open ? '#64748b' : '#2B4C7E',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
        {open ? <X size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
      </button>
    </div>
  )
}
