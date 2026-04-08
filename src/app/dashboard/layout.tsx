import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
