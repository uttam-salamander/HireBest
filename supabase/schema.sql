-- HireBest Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RECRUITERS TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'recruiter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CANDIDATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  university TEXT,
  graduation_year INTEGER,
  major TEXT,
  skills TEXT[],
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEMPLATE QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS template_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES assessment_templates(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  scoring_rubric TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, order_index)
);

-- =====================================================
-- JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  template_id UUID REFERENCES assessment_templates(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT, -- 'internship', 'full-time', 'contract'
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  candidate_email TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'started', 'completed', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- ASSESSMENT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES assessment_invitations(id) ON DELETE CASCADE UNIQUE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  current_question INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- QUESTION RESPONSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES template_questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  response_text TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  ai_rationale TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  scored_at TIMESTAMPTZ,
  UNIQUE(session_id, question_id)
);

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ai', 'candidate')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE UNIQUE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  summary TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_user ON recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_templates_company ON assessment_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_template ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_template ON jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_invitations_job ON assessment_invitations(job_id);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate ON assessment_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON assessment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON assessment_invitations(status);
CREATE INDEX IF NOT EXISTS idx_sessions_invitation ON assessment_sessions(invitation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_candidate ON assessment_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_results_session ON assessment_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_candidate ON assessment_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_results_job ON assessment_results(job_id);
CREATE INDEX IF NOT EXISTS idx_results_score ON assessment_results(overall_score);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
--
-- SECURITY MODEL:
-- - Recruiters: Authenticated users who manage jobs, templates, and view results
-- - Candidates: May or may not be authenticated; assessment-taking uses service role
-- - Service Role: Used by API routes for assessment operations (bypasses RLS)
--
-- IMPORTANT: Assessment API routes use the service role key to bypass RLS.
-- This allows unauthenticated candidates to take assessments while maintaining
-- security through application-level token validation and rate limiting.
--
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

-- Recruiters can view their own company
CREATE POLICY "Recruiters can view their company" ON companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = companies.id)
  );

-- =====================================================
-- RECRUITERS POLICIES
-- =====================================================

-- Recruiters can view and update their own profile
CREATE POLICY "Recruiters can view own profile" ON recruiters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Recruiters can update own profile" ON recruiters
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- CANDIDATES POLICIES
-- =====================================================

-- Authenticated candidates can view their own profile
CREATE POLICY "Candidates can view own profile" ON candidates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Candidates can update own profile" ON candidates
  FOR UPDATE USING (user_id = auth.uid());

-- Note: Candidate creation during assessment is handled by service role

-- =====================================================
-- ASSESSMENT TEMPLATES POLICIES
-- =====================================================

-- Recruiters can fully manage their company's templates
CREATE POLICY "Recruiters can view company templates" ON assessment_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = assessment_templates.company_id)
  );

CREATE POLICY "Recruiters can create company templates" ON assessment_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = assessment_templates.company_id)
  );

CREATE POLICY "Recruiters can update company templates" ON assessment_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = assessment_templates.company_id)
  );

CREATE POLICY "Recruiters can delete company templates" ON assessment_templates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = assessment_templates.company_id)
  );

-- =====================================================
-- TEMPLATE QUESTIONS POLICIES
-- =====================================================

-- Recruiters can manage questions for their company's templates
CREATE POLICY "Recruiters can manage template questions" ON template_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessment_templates t
      JOIN recruiters r ON r.company_id = t.company_id
      WHERE t.id = template_questions.template_id AND r.user_id = auth.uid()
    )
  );

-- Note: Questions are read during assessment via service role

-- =====================================================
-- JOBS POLICIES
-- =====================================================

-- Recruiters can fully manage their company's jobs
CREATE POLICY "Recruiters can view company jobs" ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = jobs.company_id)
  );

CREATE POLICY "Recruiters can create company jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = jobs.company_id)
  );

CREATE POLICY "Recruiters can update company jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = jobs.company_id)
  );

CREATE POLICY "Recruiters can delete company jobs" ON jobs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recruiters WHERE user_id = auth.uid() AND company_id = jobs.company_id)
  );

-- =====================================================
-- ASSESSMENT INVITATIONS POLICIES
-- =====================================================

-- Recruiters can view invitations for their company's jobs
CREATE POLICY "Recruiters can view job invitations" ON assessment_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_invitations.job_id AND r.user_id = auth.uid()
    )
  );

-- Recruiters can create invitations for their company's jobs
CREATE POLICY "Recruiters can create invitations" ON assessment_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_invitations.job_id AND r.user_id = auth.uid()
    )
  );

-- Recruiters can update invitation status (e.g., resend, cancel)
CREATE POLICY "Recruiters can update invitations" ON assessment_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_invitations.job_id AND r.user_id = auth.uid()
    )
  );

-- SECURITY NOTE: Token-based access for candidates is handled by service role
-- in API routes with application-level validation. NO public access policy.

-- =====================================================
-- ASSESSMENT SESSIONS POLICIES
-- =====================================================

-- Recruiters can view sessions for their company's jobs (read-only)
CREATE POLICY "Recruiters can view job sessions" ON assessment_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_invitations ai
      JOIN jobs j ON j.id = ai.job_id
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE ai.id = assessment_sessions.invitation_id AND r.user_id = auth.uid()
    )
  );

-- Authenticated candidates can view their own sessions
CREATE POLICY "Candidates can view own sessions" ON assessment_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidates WHERE id = assessment_sessions.candidate_id AND user_id = auth.uid())
  );

-- SECURITY NOTE: Session creation and updates during assessment are handled
-- by service role in API routes. No INSERT/UPDATE policies for anon/candidates.

-- =====================================================
-- QUESTION RESPONSES POLICIES
-- =====================================================

-- Recruiters can view responses for their company's assessments (read-only)
CREATE POLICY "Recruiters can view responses" ON question_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN assessment_invitations ai ON ai.id = s.invitation_id
      JOIN jobs j ON j.id = ai.job_id
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE s.id = question_responses.session_id AND r.user_id = auth.uid()
    )
  );

-- Authenticated candidates can view their own responses
CREATE POLICY "Candidates can view own responses" ON question_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN candidates c ON c.id = s.candidate_id
      WHERE s.id = question_responses.session_id AND c.user_id = auth.uid()
    )
  );

-- SECURITY NOTE: Response creation is handled by service role during assessment.
-- No INSERT policy for anon/candidates to prevent score manipulation.

-- =====================================================
-- CHAT MESSAGES POLICIES
-- =====================================================

-- Recruiters can view chat messages for their company's assessments (read-only)
CREATE POLICY "Recruiters can view chat messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN assessment_invitations ai ON ai.id = s.invitation_id
      JOIN jobs j ON j.id = ai.job_id
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE s.id = chat_messages.session_id AND r.user_id = auth.uid()
    )
  );

-- Authenticated candidates can view their own chat messages
CREATE POLICY "Candidates can view own chat" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN candidates c ON c.id = s.candidate_id
      WHERE s.id = chat_messages.session_id AND c.user_id = auth.uid()
    )
  );

-- SECURITY NOTE: Message creation is handled by service role during assessment.
-- No INSERT policy for anon/candidates to prevent message injection.

-- =====================================================
-- ASSESSMENT RESULTS POLICIES
-- =====================================================

-- Recruiters can view results for their company's jobs (read-only)
CREATE POLICY "Recruiters can view job results" ON assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_results.job_id AND r.user_id = auth.uid()
    )
  );

-- Authenticated candidates can view their own results
CREATE POLICY "Candidates can view own results" ON assessment_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidates WHERE id = assessment_results.candidate_id AND user_id = auth.uid())
  );

-- SECURITY NOTE: Result creation is handled by service role when assessment completes.
-- No INSERT/UPDATE policy for anon/candidates to prevent score tampering.

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiters_updated_at ON recruiters;
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON assessment_templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON assessment_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update template question count
CREATE OR REPLACE FUNCTION update_template_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE assessment_templates SET question_count = question_count + 1 WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE assessment_templates SET question_count = question_count - 1 WHERE id = OLD.template_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_count ON template_questions;
CREATE TRIGGER update_question_count AFTER INSERT OR DELETE ON template_questions
  FOR EACH ROW EXECUTE FUNCTION update_template_question_count();
