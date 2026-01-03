# Assessments

## Overview

The Assessments section provides two distinct experiences: candidates complete AI-driven conversational assessments through a focused chat interface, while recruiters view and analyze results through a dashboard. The candidate view is standalone for a distraction-free experience; the recruiter dashboard is part of the main app.

## User Flows

### Candidate Assessment
- Candidate opens assessment link and sees chat interface with sidebar
- AI asks questions one at a time, candidate types responses
- Sidebar shows progress (e.g., "Question 3 of 10"), candidate name, and job title
- After final question, candidate sees completion confirmation

### Recruiter Results Dashboard
- Recruiter views list of candidates who completed assessments (table/cards with scores)
- Clicks on a candidate to see detailed results
- Detail view shows individual responses, AI analysis, and overall score

## Design Decisions

- **Standalone candidate view:** No navigation distractions during assessment
- **Chat interface:** Conversational UI feels more natural than form-based assessments
- **Progress sidebar:** Keeps candidates informed without interrupting flow
- **Score color coding:** Teal (85+), orange (70-84), gray (<70) for quick scanning
- **Card-based dashboard:** Easy to scan multiple candidates at once

## Data Used

**Entities:** Candidate, Job, Assessment, AssessmentResult, QuestionAnalysis

**From global model:**
- Candidate — Basic profile info (name, email, avatar)
- Job — Position being assessed for (title, company)
- AssessmentResult — Score, status, summary, detailed Q&A analysis

## Components Provided

| Component | Description |
|-----------|-------------|
| `CandidateAssessment` | Main chat interface with sidebar (standalone) |
| `ChatMessage` | Individual chat message bubble |
| `ProgressSidebar` | Sidebar with progress and candidate info |
| `AssessmentResultsList` | Dashboard with stats, filters, and result cards |
| `AssessmentResultCard` | Individual candidate result card |

## Callback Props

### CandidateAssessment

| Callback | Description |
|----------|-------------|
| `onSendMessage` | Called when candidate submits a response |

### AssessmentResultsList

| Callback | Description |
|----------|-------------|
| `onViewDetails` | Called when recruiter clicks to view a result's details |
| `onFilter` | Called when recruiter filters by job or score |
| `onSort` | Called when recruiter sorts by score, date, or name |

### AssessmentResultDetail

| Callback | Description |
|----------|-------------|
| `onBack` | Called when recruiter wants to go back to the list |
| `onAdvanceCandidate` | Called when recruiter wants to move candidate to next stage |
| `onRejectCandidate` | Called when recruiter wants to reject candidate |
