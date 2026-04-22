'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Hide Header/Footer for admin and rider portals
  const isAdminRoute = pathname?.startsWith('/admin')
  const isRiderRoute = pathname?.startsWith('/rider')
  
  return (
    <>
      {!isAdminRoute && !isRiderRoute && <Header />}
      <main className={isAdminRoute || isRiderRoute ? 'min-h-screen bg-slate-900' : 'min-h-screen'}>
        {children}
      </main>
      {!isAdminRoute && !isRiderRoute && <Footer />}
    </>
  )
}
