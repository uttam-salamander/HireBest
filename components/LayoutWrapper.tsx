'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './auth/AuthProvider'
import { AppShell } from './shell'
import { useEffect } from 'react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  // Redirect to login if not authenticated (except on auth pages)
  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/auth')) {
      router.push('/auth/login')
    }
  }, [user, loading, pathname, router])

  // Don't show shell on auth pages
  if (pathname.startsWith('/auth')) {
    return <>{children}</>
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 dark:text-stone-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  const navigationItems = [
    { label: 'Assessments', href: '/assessments', isActive: pathname === '/assessments' },
    { label: 'Candidates', href: '/candidates', isActive: pathname === '/candidates' },
    { label: 'Recruiter', href: '/recruiter', isActive: pathname === '/recruiter' },
    { label: 'Matching', href: '/matching', isActive: pathname === '/matching' },
  ]

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const userData = {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    avatarUrl: user.user_metadata?.avatar_url,
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={userData}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  )
}
