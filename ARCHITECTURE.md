# HireBest - System Architecture

## Current System Design (v1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
├─────────────────────────────────────────────────────────────┤
│  Web Browser (React + Next.js)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UI Components                                        │  │
│  │  - Authentication Pages (Login/Signup)               │  │
│  │  - Assessment Dashboard                              │  │
│  │  - Navigation Shell                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ HTTPS                            │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js Server (Deployed on Vercel)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes                                           │  │
│  │  ├─ /api/assessments (GET)                          │  │
│  │  ├─ /api/assessments/[id] (GET)                     │  │
│  │  ├─ /api/jobs (GET)                                 │  │
│  │  └─ /api/auth/callback                              │  │
│  │                                                       │  │
│  │  Middleware                                           │  │
│  │  └─ Authentication (Session Management)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ API Calls                        │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        DATA TIER                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication Service                               │  │
│  │  - User signup/login                                 │  │
│  │  - JWT token generation                              │  │
│  │  - Session management                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Companies  │  │Recruiters  │  │ Candidates │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Jobs     │  │Applications│  │Assessments │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │Assessment  │  │   Chat     │  │ Question   │    │  │
│  │  │  Results   │  │  Messages  │  │  Analysis  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │                                                       │  │
│  │  Security: Row Level Security (RLS) Enabled         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## System Design Decisions & Trade-offs

### 1. **Monolithic vs Microservices**

**Decision:** Monolithic (Single Next.js application)

**Why:**
- ✅ Simpler deployment and development
- ✅ Lower latency (no inter-service communication)
- ✅ Good for MVP and small team
- ✅ Easy to reason about data flow

**Trade-offs:**
- ❌ Harder to scale individual components independently
- ❌ Single point of failure
- ❌ Tight coupling between features

**When to change:** When traffic exceeds 100K daily active users or specific features need independent scaling

---

### 2. **Database Choice: PostgreSQL (via Supabase)**

**Decision:** Relational database (PostgreSQL)

**Why:**
- ✅ Strong ACID guarantees (important for user data)
- ✅ Complex relationships (jobs, candidates, applications)
- ✅ Powerful querying capabilities
- ✅ Data integrity through foreign keys

**Trade-offs:**
- ❌ Harder to scale horizontally than NoSQL
- ❌ Schema migrations can be complex
- ❌ Not ideal for unstructured data

**Alternatives considered:**
- MongoDB (more flexible schema, but weaker consistency)
- DynamoDB (better scaling, but complex query patterns)

**When to change:** Never for this use case - relational data fits perfectly

---

### 3. **Authentication: Supabase Auth vs Custom JWT**

**Decision:** Use Supabase Auth (managed service)

**Why:**
- ✅ Battle-tested security
- ✅ Built-in features (email confirmation, password reset)
- ✅ Row Level Security integration
- ✅ Less code to maintain

**Trade-offs:**
- ❌ Vendor lock-in
- ❌ Less control over auth flow
- ❌ Migration cost if switching providers

**Alternatives considered:**
- NextAuth.js (more providers, but more setup)
- Custom JWT (full control, but security burden)

**Interview answer:** "We chose managed auth to reduce security risks and development time, accepting vendor lock-in as acceptable trade-off for MVP"

---

### 4. **Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)**

**Decision:** Hybrid approach (Next.js App Router)

**Why:**
- ✅ SEO benefits for public pages
- ✅ Fast initial page load
- ✅ Secure API calls on server
- ✅ Client-side for interactive features

**Trade-offs:**
- ❌ More complex than pure CSR
- ❌ Server costs (vs static hosting)
- ❌ Careful about server/client boundaries

---

### 5. **State Management: React Context vs Redux**

**Decision:** React Context API

**Why:**
- ✅ Built into React (no extra library)
- ✅ Simple for auth state
- ✅ Sufficient for current complexity

**Trade-offs:**
- ❌ Can cause unnecessary re-renders
- ❌ No dev tools (like Redux DevTools)
- ❌ Harder to debug complex state

**When to change:** If we have >10 global state slices or complex state interactions

---

### 6. **API Design: REST vs GraphQL**

**Decision:** REST API

**Why:**
- ✅ Simpler to implement
- ✅ Browser caching works naturally
- ✅ Standard HTTP methods
- ✅ Good for CRUD operations

**Trade-offs:**
- ❌ Over-fetching (getting more data than needed)
- ❌ Under-fetching (multiple requests)
- ❌ No schema introspection

**Alternatives considered:**
- GraphQL (better for complex queries, but more setup)
- tRPC (type-safe, but TypeScript-only)

---

## Current System Characteristics

### Performance Metrics (Estimated)
- **Response Time:** <200ms for API calls
- **Time to Interactive:** ~2s on first load
- **Database Query Time:** <50ms with indexes
- **Concurrent Users Supported:** ~1,000 (Supabase free tier)

### Scalability Limits (Current Architecture)
- **Horizontal Scaling:** Vercel auto-scales Next.js (✅)
- **Database:** Supabase free tier (limited connections)
- **File Storage:** None yet (will add for resumes)
- **Caching:** None (browser cache only)

### Security Features
- ✅ JWT-based authentication
- ✅ HTTPS only
- ✅ Row Level Security (RLS) in database
- ✅ CSRF protection (Next.js built-in)
- ✅ SQL injection prevention (Supabase client)
- ❌ Rate limiting (NOT IMPLEMENTED YET)
- ❌ DDoS protection (relying on Vercel)

---

## What's Next: AI Assessment Feature (System Design)

### Challenge:
**How to handle AI-powered assessments at scale?**

### Questions to Consider:
1. Should AI calls be synchronous or asynchronous?
2. How to handle slow AI responses (30-60 seconds)?
3. What if OpenAI API is down?
4. How to prevent abuse (spam assessments)?
5. Should we cache AI responses?

### We'll Discuss:
- **Request-Response vs Message Queue**
- **Caching strategies**
- **Retry logic and circuit breakers**
- **Rate limiting**
- **Database write patterns**

---

*This document will be updated as we add features and make design decisions.*
