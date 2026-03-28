'use client'

interface Props {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="card text-center py-16">
      <span className="text-5xl block mb-4">{icon}</span>
      <p className="text-white font-bold text-base">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1.5 font-medium">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
