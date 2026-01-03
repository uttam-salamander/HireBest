# Milestone 2: Assessments

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

## Goal

Implement the Assessments feature — the MVP section where candidates complete AI-driven assessments and recruiters view results.

## Overview

The Assessments section provides two distinct experiences: candidates complete AI-driven conversational assessments through a focused chat interface, while recruiters view and analyze results through a dashboard. The candidate view is standalone for a distraction-free experience; the recruiter dashboard is part of the main app.

**Key Functionality:**
- Candidates take AI-driven assessments through a conversational chat interface
- Sidebar shows progress, candidate info, and job details during assessment
- Recruiters view a dashboard of all completed assessments with scores
- Recruiters can search, filter by job, and sort results
- Recruiters click through to see detailed results with AI analysis

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/assessments/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

The test instructions are framework-agnostic — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/assessments/components/`:

**Candidate Assessment View (Standalone):**
- `CandidateAssessment.tsx` — Main chat interface with sidebar
- `ChatMessage.tsx` — Individual chat message bubbles
- `ProgressSidebar.tsx` — Sidebar with progress and candidate info

**Recruiter Dashboard (Inside Shell):**
- `AssessmentResultsList.tsx` — Dashboard with stats, filters, and result cards
- `AssessmentResultCard.tsx` — Individual candidate result card

### Data Layer

The components expect these data shapes:

```typescript
// Candidate Assessment
interface CurrentAssessment {
  candidate: { id, name, email, avatarUrl }
  job: { id, title, company }
  progress: { currentQuestion, totalQuestions }
  chatMessages: ChatMessage[]
}

// Recruiter Dashboard
interface AssessmentResult {
  id: string
  candidate: { id, name, email, avatarUrl }
  job: { id, title, company }
  overallScore: number
  status: 'completed' | 'in_progress' | 'abandoned'
  completedAt: string
  summary: string
  questionAnalysis: QuestionAnalysis[]
}
```

You'll need to:
- Create API endpoints for fetching assessment data
- Implement AI chat functionality (send question, receive response)
- Store assessment results in your database
- Connect real data to the components

### Callbacks

Wire up these user actions:

**Candidate Assessment:**
| Callback | Description |
|----------|-------------|
| `onSendMessage` | Called when candidate submits a response |

**Recruiter Dashboard:**
| Callback | Description |
|----------|-------------|
| `onViewDetails` | Called when recruiter clicks to view a result's details |
| `onFilter` | Called when recruiter filters by job or score |
| `onSort` | Called when recruiter sorts by score, date, or name |

### Empty States

Implement empty state UI for when no records exist yet:

- **No assessment results:** Show a helpful message when no candidates have completed assessments
- **No filtered results:** Show a message when filters return no matches
- **First-time recruiter:** Guide recruiters on how assessments work

The provided components include empty state designs — make sure to render them when data is empty rather than showing blank screens.

## Files to Reference

- `product-plan/sections/assessments/README.md` — Feature overview and design intent
- `product-plan/sections/assessments/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/assessments/components/` — React components
- `product-plan/sections/assessments/types.ts` — TypeScript interfaces
- `product-plan/sections/assessments/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: Candidate Takes Assessment

1. Candidate opens assessment link (standalone page, no shell)
2. Candidate sees chat interface with sidebar showing their info and progress
3. AI asks questions one at a time
4. Candidate types responses and presses Enter or clicks Send
5. Progress updates in sidebar after each response
6. **Outcome:** After final question, candidate sees completion confirmation

### Flow 2: Recruiter Views Assessment Results

1. Recruiter navigates to Assessments in the app shell
2. Recruiter sees dashboard with stats (total, average score, high performers)
3. Recruiter uses search to find candidates by name
4. Recruiter filters by job using dropdown
5. Recruiter sorts by score, date, or name
6. **Outcome:** Filtered and sorted list of assessment result cards

### Flow 3: Recruiter Views Detailed Results

1. Recruiter clicks "View Full Results" on a candidate card
2. Recruiter sees detailed view with all Q&A and AI analysis
3. Recruiter reviews individual question scores and feedback
4. **Outcome:** Full understanding of candidate's performance

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Candidate can complete assessment chat flow
- [ ] Recruiter can view assessment results dashboard
- [ ] Search, filter, and sort work correctly
- [ ] Empty states display properly when no records exist
- [ ] Components render with real data from backend
- [ ] Matches the visual design
- [ ] Responsive on mobile
