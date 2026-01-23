'use client'

import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: {
    name: string
    avatarUrl?: string
  }
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                onNavigate?.('/')
              }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-sm font-bold text-primary-foreground">H</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                HireBest
              </span>
            </a>
          </div>

          <MainNav items={navigationItems} onNavigate={onNavigate} />

          <div className="flex items-center gap-4">
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault()
                onNavigate?.('/settings')
              }}
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block"
            >
              Settings
            </a>
            {user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
