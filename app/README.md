# HireBest

AI-powered campus hiring platform with conversational assessments.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Credentials + Google OAuth)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI**: OpenRouter + Vercel AI SDK (planned)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm/npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/hirebest.git
cd hirebest/app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user@localhost:5432/hirebest"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI Scoring
OPENROUTER_API_KEY=""
```

## Project Structure

```
app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   ├── assessment/    # Candidate assessment UI
│   │   └── dashboard/     # Recruiter dashboard (TODO)
│   ├── components/ui/     # shadcn/ui components
│   └── lib/
│       ├── auth.ts        # NextAuth configuration
│       └── db.ts          # Prisma client
└── package.json
```

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:seed    # Seed database with test data
npm run db:reset   # Reset database and re-migrate
```

## Test Credentials

After running `npm run db:seed`:

- **Recruiter**: recruiter@techcorp.com / password123
- **Assessment URL**: Check console output for token

## Features

### Implemented
- [x] Landing page with features
- [x] User registration (recruiter accounts)
- [x] User login (credentials + Google OAuth)
- [x] Candidate assessment chat interface
- [x] Progress tracking
- [x] Assessment completion flow

### Planned
- [ ] Recruiter dashboard
- [ ] AI-powered scoring (OpenRouter)
- [ ] Email invitations
- [ ] Assessment templates CRUD
- [ ] Results analytics

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create recruiter account |
| GET | `/api/assessments/[token]` | Get assessment data |
| POST | `/api/assessments/[token]/respond` | Submit response |

## Database Schema

Key entities:
- **User** - Authentication accounts
- **Company** - Organizations
- **Recruiter** - Company employees who create jobs
- **Candidate** - Assessment takers
- **Job** - Open positions
- **AssessmentTemplate** - Question sets
- **AssessmentInvitation** - Token-based invites
- **AssessmentSession** - Active assessments
- **AssessmentResult** - Scored outcomes

## Design System

- **Primary**: Orange (`oklch(0.702 0.183 41.116)`)
- **Secondary**: Teal (`oklch(0.679 0.127 180.532)`)
- **Neutral**: Stone palette
- **Typography**: Quicksand (headings), IBM Plex Mono (code)

## Known Issues

See code review for security and quality issues to address before production.

## License

Private - All rights reserved
