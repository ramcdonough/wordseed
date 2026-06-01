import { BottomNav } from '@/components/nav/BottomNav'
import { ToastContainer } from '@/components/ui/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20" style={{ paddingTop: 'var(--safe-area-top)' }}>
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
