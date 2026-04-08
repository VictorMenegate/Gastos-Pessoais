import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page">
      <Sidebar />
      {/* md: single sidebar 220px | lg: icon rail 64px + nav panel 200px = 264px */}
      <main className="md:ml-[220px] lg:ml-[264px] pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
