import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#e8ebf0' }}>
      <Sidebar />
      <main className="md:ml-[240px] pb-20 md:pb-0 min-h-screen md:py-3 md:pr-3">
        <div className="min-h-full md:bg-white md:min-h-[calc(100vh-24px)] md:overflow-auto"
          style={{ borderRadius: 'var(--content-radius, 0)' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
