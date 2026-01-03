# Test Instructions: Assessments

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, RSpec, Minitest, PHPUnit, etc.).

## Overview

The Assessments section has two main views:
1. **Candidate Assessment** — Chat interface where candidates answer AI questions
2. **Recruiter Dashboard** — View and analyze completed assessment results

---

## User Flow Tests

### Flow 1: Candidate Completes Assessment

**Scenario:** A candidate takes an AI-driven assessment for a job position

#### Success Path

**Setup:**
- Candidate has a valid assessment link
- Assessment is for "Frontend Developer Intern" at "TechFlow Inc."
- Assessment has 8 total questions

**Steps:**
1. Candidate opens assessment link
2. Candidate sees chat interface with sidebar showing their name and job info
3. Candidate sees first AI question in the chat
4. Candidate types a response in the textarea
5. Candidate presses Enter or clicks the orange Send button
6. AI responds with the next question
7. Progress in sidebar updates (e.g., "Question 2 of 8")
8. Repeat for all questions

**Expected Results:**
- [ ] Chat interface displays with sidebar on desktop
- [ ] Sidebar shows candidate name, email, job title, and company
- [ ] Progress bar updates after each response
- [ ] Each question step shows correct state (completed = teal check, current = orange pulse, pending = gray circle)
- [ ] Send button is disabled when textarea is empty
- [ ] Send button is enabled when textarea has content
- [ ] After sending, message appears in chat with orange bubble
- [ ] AI response appears with teal bubble
- [ ] Typing indicator shows while waiting for AI response

#### Failure Path: Network Error

**Setup:**
- API call to submit response fails with 500 error

**Steps:**
1. Candidate types a response
2. Candidate clicks Send

**Expected Results:**
- [ ] Error message appears: "Unable to send your response. Please try again."
- [ ] Response text is preserved in textarea (not cleared)
- [ ] Send button remains enabled for retry

### Flow 2: Recruiter Views Assessment Results Dashboard

**Scenario:** Recruiter views the list of completed assessments

#### Success Path

**Setup:**
- 6 completed assessment results exist
- Results have varied scores (65, 78, 85, 88, 91, 92)
- Results are for 2 different jobs

**Steps:**
1. Recruiter navigates to /assessments in the app
2. Recruiter sees dashboard with stats cards
3. Recruiter sees grid of candidate result cards

**Expected Results:**
- [ ] Page heading shows "Assessment Results"
- [ ] Stats show: Total Assessments (6), Average Score (83%), High Performers (4)
- [ ] 6 candidate cards are displayed
- [ ] Each card shows: candidate avatar/initials, name, email, job title, date, score badge
- [ ] Score badges are color-coded: teal (85+), orange (70-84), gray (<70)
- [ ] Summary text is truncated to 2 lines
- [ ] Question progress bars show individual scores

### Flow 3: Recruiter Searches and Filters Results

**Scenario:** Recruiter uses search and filters to find specific candidates

#### Success Path

**Setup:**
- Multiple results exist for different jobs and candidates

**Steps:**
1. Recruiter types "Marcus" in the search box
2. Results filter to show only candidates matching "Marcus"
3. Recruiter clears search
4. Recruiter selects "Frontend Developer Intern" from job dropdown
5. Results filter to show only that job's assessments
6. Recruiter clicks "Score" sort button
7. Results sort by score (highest first)

**Expected Results:**
- [ ] Search filters results as user types
- [ ] Search is case-insensitive
- [ ] Job filter dropdown shows all unique jobs from results
- [ ] Selecting a job filters the grid
- [ ] Sort buttons highlight when active (orange background)
- [ ] Clicking active sort button toggles direction (asc/desc)

#### No Results State

**Setup:**
- Search term matches no candidates

**Steps:**
1. Recruiter types "xyz123" in search box

**Expected Results:**
- [ ] Empty state message appears: "No results match your filters"
- [ ] Stats cards still show original totals (not filtered counts)

### Flow 4: Recruiter Views Detailed Results

**Scenario:** Recruiter clicks through to see full assessment details

#### Success Path

**Setup:**
- Candidate "Marcus Chen" completed assessment with score 92

**Steps:**
1. Recruiter clicks "View Full Results" on Marcus's card
2. Detail view opens showing full assessment

**Expected Results:**
- [ ] Detail view shows candidate name, email, job, completion date
- [ ] Overall score (92) prominently displayed
- [ ] AI summary paragraph visible
- [ ] Each question shows: question text, candidate response, score, AI feedback
- [ ] Individual question scores are color-coded
- [ ] "Back" button returns to list view
- [ ] "Advance" and "Reject" action buttons are visible

---

## Empty State Tests

### Primary Empty State: No Assessment Results

**Scenario:** No candidates have completed assessments yet

**Setup:**
- `results` array is empty (`[]`)

**Expected Results:**
- [ ] Stats show: Total Assessments (0), Average Score (0%), High Performers (0)
- [ ] Empty state message: "No assessment results yet"
- [ ] Search and filter controls are still visible
- [ ] No broken layout or errors

### Filtered Empty State

**Scenario:** Filters return no matching results

**Setup:**
- Results exist but search/filter matches nothing

**Expected Results:**
- [ ] Empty state message: "No results match your filters"
- [ ] Clear guidance on how to adjust filters
- [ ] Original stats still visible (show total, not filtered)

---

## Component Interaction Tests

### CandidateAssessment

**Renders correctly:**
- [ ] Shows candidate name "Priya Sharma" in sidebar
- [ ] Shows job "Frontend Developer Intern at TechFlow Inc."
- [ ] Shows progress "Question 3 of 8"
- [ ] Displays all chat messages in order

**User interactions:**
- [ ] Clicking hamburger menu opens sidebar on mobile
- [ ] Clicking X closes sidebar on mobile
- [ ] Typing in textarea enables Send button
- [ ] Pressing Enter submits (Shift+Enter for new line)
- [ ] Clicking Send button calls `onSendMessage` with message text

### AssessmentResultCard

**Renders correctly:**
- [ ] Displays candidate initials when no avatar
- [ ] Shows score badge with correct color
- [ ] Formats date as "Jan 14, 2024"
- [ ] Truncates long summary text

**User interactions:**
- [ ] Clicking "View Full Results" calls `onViewDetails` with result ID
- [ ] Card hover effect shows shadow

### ProgressSidebar

**Renders correctly:**
- [ ] Shows candidate avatar or initials fallback
- [ ] Shows progress percentage
- [ ] Progress bar width matches percentage
- [ ] Completed questions have teal checkmarks
- [ ] Current question has orange pulsing indicator
- [ ] Pending questions have gray circles

---

## Edge Cases

- [ ] Handles very long candidate names with truncation
- [ ] Handles very long response text in chat
- [ ] Works correctly with 1 result and 100+ results
- [ ] Handles candidates with no avatar (shows initials)
- [ ] Handles assessment with 1 question and 20+ questions
- [ ] Progress bar animates smoothly on updates
- [ ] Mobile sidebar opens/closes without layout shift

---

## Accessibility Checks

- [ ] All interactive elements are keyboard accessible
- [ ] Chat textarea has proper label
- [ ] Send button has aria-label when icon-only
- [ ] Progress steps are announced correctly
- [ ] Score cards have proper heading structure
- [ ] Focus is managed after sending message
- [ ] Mobile menu button has aria-label

---

## Sample Test Data

Use the data from `sample-data.json` or create variations:

```typescript
// Candidate assessment in progress
const mockAssessment = {
  candidate: { id: "cand-001", name: "Priya Sharma", email: "priya@university.edu", avatarUrl: null },
  job: { id: "job-001", title: "Frontend Developer Intern", company: "TechFlow Inc." },
  progress: { currentQuestion: 3, totalQuestions: 8 },
  chatMessages: [
    { id: "msg-001", role: "ai", content: "Hi Priya! Ready to begin?", timestamp: "2024-01-15T10:00:00Z" },
    { id: "msg-002", role: "candidate", content: "Yes, I'm ready!", timestamp: "2024-01-15T10:00:45Z" }
  ]
}

// Assessment results for dashboard
const mockResults = [
  {
    id: "result-001",
    candidate: { id: "cand-002", name: "Marcus Chen", email: "marcus@stanford.edu", avatarUrl: null },
    job: { id: "job-001", title: "Frontend Developer Intern", company: "TechFlow Inc." },
    overallScore: 92,
    status: "completed",
    completedAt: "2024-01-14T15:30:00Z",
    summary: "Exceptional candidate with strong technical skills.",
    questionAnalysis: [
      { question: "Tell me about a project...", response: "I built...", score: 95, feedback: "Great work!" }
    ]
  }
]

// Empty states
const mockEmptyResults = []
```

---

## Notes for Test Implementation

- Mock the AI response timing (2 second delay in the component)
- Test both mobile and desktop viewport sizes
- Verify dark mode styling works correctly
- Test keyboard navigation through the chat interface
- Ensure score color thresholds are correct (85+ teal, 70-84 orange, <70 gray)
