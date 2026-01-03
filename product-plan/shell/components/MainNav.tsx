import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  isActive?: boolean
}

export interface MainNavProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
}

export function MainNav({ items, onNavigate }: MainNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    onNavigate?.(href)
    setMobileMenuOpen(false)
  }

  return (
    <nav className="relative">
      {/* Desktop Navigation */}
      <ul className="hidden items-center gap-1 md:flex">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                item.isActive
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="flex items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 md:hidden"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-2 shadow-lg dark:border-stone-700 dark:bg-stone-800 md:hidden">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/settings"
                onClick={(e) => handleClick(e, '/settings')}
                className="block rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
              >
                Settings
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
