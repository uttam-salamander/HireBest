# Application Shell

## Overview

HireBest uses a top navigation layout with a horizontal nav bar containing the main sections, a settings link, and a user menu in the top right corner. The shell provides consistent navigation across the entire application.

## Navigation Structure

- **Assessments** → `/assessments` (default view)
- **Candidate Portal** → `/candidates`
- **Recruiter Dashboard** → `/recruiter`
- **Matching & Ranking** → `/matching`
- **Settings** → `/settings`

## User Menu

Located in the top right corner of the navigation bar. Contains:
- User avatar (with initials fallback using teal background)
- User name
- Dropdown menu with logout option

## Layout Pattern

Top navigation bar with:
- Logo on the left (orange "H" badge + "HireBest" text)
- Main nav items in the center
- Settings link and user menu on the right
- Content area below spanning full width (max-width: 7xl)

## Responsive Behavior

- **Desktop:** Full horizontal navigation with all items visible
- **Mobile:** Hamburger menu icon that expands to show navigation items in a dropdown

## Design Notes

- Uses orange as the primary accent color for active states and hover
- Uses teal as secondary accent for user avatar
- Stone neutral palette for backgrounds and text
- Quicksand font for all navigation text
- Supports light and dark mode

## Components Provided

| Component | Description |
|-----------|-------------|
| `AppShell.tsx` | Main layout wrapper with header and content area |
| `MainNav.tsx` | Navigation component with mobile hamburger menu |
| `UserMenu.tsx` | User avatar dropdown with logout |
| `index.ts` | Exports all components |

## Props

### AppShell

```typescript
interface AppShellProps {
  children: React.ReactNode
  navigationItems: Array<{ label: string; href: string; isActive?: boolean }>
  user?: { name: string; avatarUrl?: string }
  onNavigate?: (href: string) => void
  onLogout?: () => void
}
```

### MainNav

```typescript
interface MainNavProps {
  items: Array<{ label: string; href: string; isActive?: boolean }>
  onNavigate?: (href: string) => void
}
```

### UserMenu

```typescript
interface UserMenuProps {
  user: { name: string; avatarUrl?: string }
  onLogout?: () => void
}
```
