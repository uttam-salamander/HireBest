import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'

export interface UserMenuProps {
  user: {
    name: string
    avatarUrl?: string
  }
  onLogout?: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-xs font-medium text-white">
            {initials}
          </div>
        )}
        <span className="hidden text-sm font-medium text-stone-700 dark:text-stone-300 sm:block">
          {user.name}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-stone-500 dark:text-stone-400 sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-800">
          <div className="border-b border-stone-200 px-4 py-2 dark:border-stone-700 sm:hidden">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {user.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
