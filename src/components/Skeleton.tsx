'use client'

// Blocos de carregamento com shimmer (classe .skeleton em globals.css)

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

/** Linhas estilo "History": círculo + duas linhas + valor à direita */
export function SkeletonList({ rows = 5, card = true }: { rows?: number; card?: boolean }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${card ? 'card' : ''} flex items-center gap-3`}>
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Card genérico de carregamento (gráficos, formulários) */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
      ))}
    </div>
  )
}
