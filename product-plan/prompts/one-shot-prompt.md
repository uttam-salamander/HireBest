# One-Shot Implementation Prompt

Copy and paste this prompt into your coding agent to implement the complete HireBest application.

---

I need you to implement a complete web application based on detailed design specifications and UI components I'm providing.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary with sections and data model overview
2. **@product-plan/instructions/one-shot-instructions.md** — Complete implementation instructions for all milestones

After reading these, also review:
- **@product-plan/design-system/** — Color and typography tokens
- **@product-plan/data-model/** — Entity types and relationships
- **@product-plan/shell/** — Application shell components
- **@product-plan/sections/** — All section components, types, sample data, and test instructions

## Before You Begin

Please ask me clarifying questions about:

1. **Authentication & Authorization**
   - How should users sign up and log in? (email/password, OAuth providers, magic links?)
   - Are there different user roles with different permissions? (candidates vs recruiters)
   - Should there be an admin interface?

2. **User & Account Modeling**
   - Should candidates and recruiters be separate user types or roles on the same user?
   - Do recruiters belong to companies/organizations?
   - How should user profiles be structured?

3. **Tech Stack Preferences**
   - What backend framework/language should I use? (Node.js, Python, Ruby, etc.)
   - What database do you prefer? (PostgreSQL, MongoDB, etc.)
   - Any specific hosting/deployment requirements?

4. **AI Integration**
   - How should the AI assessment chat work? (OpenAI, Anthropic, custom?)
   - Should assessments be generated dynamically or use templates?
   - How should AI analysis of responses work?

5. **Backend Business Logic**
   - Any server-side logic, validations or processes needed beyond what's shown in the UI?
   - Email notifications for assessment completion?
   - Background processes for scoring?

6. **Any Other Clarifications**
   - Questions about specific features or user flows
   - Edge cases that need clarification
   - Integration requirements

Lastly, be sure to ask me if I have any other notes to add for this implementation.

Once I answer your questions, create a comprehensive implementation plan before coding.
