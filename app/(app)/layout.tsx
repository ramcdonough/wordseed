export const dynamic = 'force-dynamic'

import { BottomNav } from '@/components/nav/BottomNav'
import { ToastContainer } from '@/components/ui/Toast'
import { AppShell } from '@/components/auth/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <main
          className="flex-1"
          style={{
            paddingTop: 'var(--safe-area-top)',
            paddingBottom: 'calc(4rem + var(--safe-area-bottom))',
          }}
        >
          {children}
        </main>
        <BottomNav />
        <ToastContainer />
      </div>
    </AppShell>
  )
}
