# Data Model

## Entities

### Candidate
A student or job seeker who creates a profile and applies to jobs. Contains their education, skills, experience, and contact information.

### Recruiter
An HR team member or hiring manager who posts jobs and reviews candidates. Manages the hiring pipeline for their company.

### Company
An organization that employs recruiters and posts job openings. Represents the employer brand on the platform.

### Job
A job opening with requirements, posted by a recruiter. Includes role details, required skills, and qualifications.

### Application
A candidate's application to a specific job. Tracks the status of the candidate through the hiring pipeline.

### Assessment
An AI-powered test tied to a job, measuring candidate fit. Contains questions and evaluation criteria aligned with job requirements.

### AssessmentResult
A candidate's score and performance data from completing an assessment. Provides recruiters with objective data for hiring decisions.

## Relationships

```
Company
  └── has many → Recruiters
        └── creates many → Jobs
              └── has one → Assessment
              └── has many → Applications

Candidate
  └── submits many → Applications
        └── links to → Job
  └── takes → Assessments
        └── produces → AssessmentResults
```

## Entity Relationship Summary

| Relationship | Description |
|--------------|-------------|
| Company → Recruiters | One-to-many: A company employs multiple recruiters |
| Recruiter → Jobs | One-to-many: A recruiter creates multiple job postings |
| Job → Assessment | One-to-one: Each job has one associated assessment |
| Job → Applications | One-to-many: A job receives multiple applications |
| Candidate → Applications | One-to-many: A candidate can apply to multiple jobs |
| Application → Job | Many-to-one: Links a candidate to a specific job |
| AssessmentResult → Candidate | Many-to-one: Links a result to the candidate who took it |
| AssessmentResult → Assessment | Many-to-one: Links a result to the assessment taken |
