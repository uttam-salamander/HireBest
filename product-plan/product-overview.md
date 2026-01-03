# HireBest — Product Overview

## Summary

HireBest is a campus-focused hiring platform that connects students with employers. Students create profiles and apply to job openings, while HR teams and hiring managers post positions and manage applicants. AI-powered assessments help recruiters quickly identify the best-fit candidates.

## Planned Sections

1. **Assessments** — AI-powered candidate assessments and results dashboard for recruiters (MVP)
2. **Candidate Portal** — Students create profiles, browse jobs, and submit applications
3. **Recruiter Dashboard** — HR and hiring managers post jobs, view applicants, and manage the hiring pipeline
4. **Matching & Ranking** — AI-powered skill matching that scores and ranks candidates against job requirements

## Data Model

**Entities:**
- Candidate — A student or job seeker who creates a profile and applies to jobs
- Recruiter — An HR team member or hiring manager who posts jobs and reviews candidates
- Company — An organization that employs recruiters and posts job openings
- Job — A job opening with requirements, posted by a recruiter
- Application — A candidate's application to a specific job
- Assessment — An AI-powered test tied to a job, measuring candidate fit
- AssessmentResult — A candidate's score and performance data from completing an assessment

**Key Relationships:**
- Company has many Recruiters
- Recruiter creates many Jobs
- Job has one Assessment
- Candidate submits many Applications
- AssessmentResult links a Candidate to an Assessment

## Design System

**Colors:**
- Primary: `orange` — for buttons, links, key accents
- Secondary: `teal` — for tags, highlights, secondary elements
- Neutral: `stone` — for backgrounds, text, borders

**Typography:**
- Heading: Quicksand
- Body: Quicksand
- Mono: IBM Plex Mono

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, routing, and application shell
2. **Assessments** — AI-powered candidate assessments and results dashboard (MVP)
3. **Candidate Portal** — Student profiles, job browsing, and applications
4. **Recruiter Dashboard** — Job posting and applicant management
5. **Matching & Ranking** — AI-powered candidate scoring and ranking

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
