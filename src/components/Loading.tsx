'use client'

export default function Loading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center justify-center py-16">
      <div className={`animate-spin rounded-full border-2 border-surface-border ${sizes[size]}`}
        style={{ borderTopColor: '#2B4C7E' }} />
    </div>
  )
}
