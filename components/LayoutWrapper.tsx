'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './auth/AuthProvider'
import { AppShell } from './shell'
import { useEffect } from 'react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userProfile, loading, profileLoading, signOut } = useAuth()

  // Redirect to login if not authenticated (except on auth pages and public assessment pages)
  useEffect(() => {
    const isPublicRoute = pathname.startsWith('/auth') || pathname.startsWith('/assessment/')

    if (!loading && !user && !isPublicRoute) {
      router.push('/auth/login')
    }
  }, [user, loading, pathname, router])

  // Route protection based on user type
  useEffect(() => {
    if (!loading && !profileLoading && user && userProfile) {
      const isCandidateRoute = pathname.startsWith('/candidate')
      const isRecruiterRoute = pathname.startsWith('/dashboard') ||
                               pathname === '/assessments' ||
                               pathname === '/candidates' ||
                               pathname === '/recruiter'

      if (userProfile.userType === 'candidate' && isRecruiterRoute) {
        router.push('/candidate/dashboard')
      } else if (userProfile.userType === 'recruiter' && isCandidateRoute) {
        router.push('/dashboard')
      }
    }
  }, [user, userProfile, loading, profileLoading, pathname, router])

  // Don't show shell on auth pages or public assessment pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/assessment/')) {
    return <>{children}</>
  }

  // Show loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Navigation items based on user type
  const getCandidateNavigation = () => [
    { label: 'Dashboard', href: '/candidate/dashboard', isActive: pathname === '/candidate/dashboard' },
    { label: 'Assessments', href: '/candidate/assessments', isActive: pathname === '/candidate/assessments' },
    { label: 'Job Matches', href: '/matching', isActive: pathname === '/matching' },
    { label: 'Profile', href: '/candidate/profile', isActive: pathname === '/candidate/profile' },
  ]

  const getRecruiterNavigation = () => [
    { label: 'Dashboard', href: '/dashboard', isActive: pathname === '/dashboard' },
    { label: 'Jobs', href: '/dashboard/jobs', isActive: pathname.startsWith('/dashboard/jobs') },
    { label: 'Templates', href: '/dashboard/templates', isActive: pathname.startsWith('/dashboard/templates') },
    { label: 'Results', href: '/dashboard/results', isActive: pathname.startsWith('/dashboard/results') },
  ]

  const navigationItems = userProfile?.userType === 'candidate'
    ? getCandidateNavigation()
    : getRecruiterNavigation()

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const userData = {
    name: userProfile?.profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    avatarUrl: (userProfile?.userType === 'candidate' ? userProfile.profile?.avatar_url : null) || user.user_metadata?.avatar_url,
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
