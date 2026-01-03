# HireBest — Complete Implementation Instructions

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

The test instructions include:
- Specific UI elements, button labels, and interactions to verify
- Expected success and failure behaviors
- Empty state handling (when no records exist yet)
- Data assertions and state validations

---

## Product Overview

HireBest is a campus-focused hiring platform that connects students with employers. Students create profiles and apply to job openings, while HR teams and hiring managers post positions and manage applicants. AI-powered assessments help recruiters quickly identify the best-fit candidates.

### Planned Sections

1. **Assessments** — AI-powered candidate assessments and results dashboard (MVP)
2. **Candidate Portal** — Students create profiles, browse jobs, submit applications
3. **Recruiter Dashboard** — HR/hiring managers post jobs, view applicants, manage pipeline
4. **Matching & Ranking** — AI-powered skill matching and candidate scoring

### Data Model

**Entities:** Candidate, Recruiter, Company, Job, Application, Assessment, AssessmentResult

**Key Relationships:**
- Company has many Recruiters
- Recruiter creates many Jobs
- Job has one Assessment
- Candidate submits many Applications
- AssessmentResult links a Candidate to an Assessment

### Design System

**Colors:** orange (primary), teal (secondary), stone (neutral)
**Typography:** Quicksand (heading/body), IBM Plex Mono (code)

---

# Milestone 1: Foundation

## Goal

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

- See `product-plan/data-model/types.ts` for interface definitions
- See `product-plan/data-model/README.md` for entity relationships

### 3. Routing Structure

Create routes:
- `/assessments` — Assessments dashboard (default)
- `/candidates` — Candidate Portal
- `/recruiter` — Recruiter Dashboard
- `/matching` — Matching & Ranking
- `/settings` — Settings page

### 4. Application Shell

Copy shell components from `product-plan/shell/components/`:
- `AppShell.tsx` — Main layout wrapper
- `MainNav.tsx` — Top navigation
- `UserMenu.tsx` — User menu with avatar

## Done When

- [ ] Design tokens configured
- [ ] Data model types defined
- [ ] Routes exist for all sections
- [ ] Shell renders with navigation
- [ ] Responsive on mobile

---

# Milestone 2: Assessments

## Goal

Implement the Assessments feature — the MVP section.

## Overview

Two distinct experiences:
1. **Candidate Assessment** — Chat interface where candidates answer AI questions (standalone, no shell)
2. **Recruiter Dashboard** — View and analyze completed assessments (inside shell)

## Components

**Candidate Assessment View:**
- `CandidateAssessment.tsx` — Main chat interface with sidebar
- `ChatMessage.tsx` — Chat message bubbles
- `ProgressSidebar.tsx` — Progress and candidate info

**Recruiter Dashboard:**
- `AssessmentResultsList.tsx` — Dashboard with stats, filters, cards
- `AssessmentResultCard.tsx` — Individual result card

## Callbacks to Wire Up

**Candidate:**
- `onSendMessage(message)` — Submit candidate response

**Recruiter:**
- `onViewDetails(resultId)` — View detailed results
- `onFilter(filters)` — Filter by job/score
- `onSort(field, direction)` — Sort results

## User Flows

1. Candidate opens assessment link, chats with AI, completes all questions
2. Recruiter views dashboard, searches/filters/sorts, sees candidate scores
3. Recruiter clicks card to see detailed Q&A and AI analysis

## Files to Reference

- `product-plan/sections/assessments/tests.md` — Write tests first!
- `product-plan/sections/assessments/components/` — React components
- `product-plan/sections/assessments/types.ts` — TypeScript interfaces
- `product-plan/sections/assessments/sample-data.json` — Test data

## Done When

- [ ] Tests written and passing
- [ ] Candidate can complete assessment chat
- [ ] Recruiter can view/search/filter/sort results
- [ ] Empty states display properly
- [ ] Responsive on mobile
