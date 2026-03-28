'use client'

export default function Loading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div className={`animate-spin rounded-full border-2 border-transparent ${sizes[size]}`}
          style={{ borderTopColor: '#22c55e', borderRightColor: 'rgba(34,197,94,0.3)' }} />
        <div className="absolute inset-0 rounded-full animate-pulse-soft"
          style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15), transparent)' }} />
      </div>
    </div>
  )
}
