-- HireBest Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE companies (
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
CREATE TABLE recruiters (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CANDIDATES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- JOBS TABLE
-- =====================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT, -- 'internship', 'full-time', 'contract'
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'draft'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'interviewing', 'offered', 'rejected'
  cover_letter TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);

-- =====================================================
-- ASSESSMENTS TABLE
-- =====================================================
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  total_questions INTEGER DEFAULT 8,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT RESULTS TABLE
-- =====================================================
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  summary TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT MESSAGES TABLE (for assessment conversations)
-- =====================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ai', 'candidate')),
  content TEXT NOT NULL,
  question_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QUESTION ANALYSIS TABLE (AI evaluation of responses)
-- =====================================================
CREATE TABLE question_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  question_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_recruiters_company ON recruiters(company_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_assessment_results_candidate ON assessment_results(candidate_id);
CREATE INDEX idx_assessment_results_job ON assessment_results(job_id);
CREATE INDEX idx_assessment_results_status ON assessment_results(status);
CREATE INDEX idx_chat_messages_result ON chat_messages(assessment_result_id);
CREATE INDEX idx_question_analysis_result ON question_analysis(assessment_result_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analysis ENABLE ROW LEVEL SECURITY;

-- Candidates can read their own data
CREATE POLICY "Candidates can view own profile" ON candidates
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Candidates can update own profile" ON candidates
  FOR UPDATE USING (auth.uid() = id);

-- Recruiters can read their own data
CREATE POLICY "Recruiters can view own profile" ON recruiters
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Recruiters can update own profile" ON recruiters
  FOR UPDATE USING (auth.uid() = id);

-- Jobs are publicly readable, recruiters can manage their company's jobs
CREATE POLICY "Anyone can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Recruiters can insert jobs for their company" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recruiters WHERE id = auth.uid() AND company_id = jobs.company_id)
  );

CREATE POLICY "Recruiters can update their company's jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recruiters WHERE id = auth.uid() AND company_id = jobs.company_id)
  );

-- Applications
CREATE POLICY "Candidates can view own applications" ON applications
  FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can create applications" ON applications
  FOR INSERT WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Recruiters can view applications for their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = applications.job_id AND r.id = auth.uid()
    )
  );

-- Assessment Results
CREATE POLICY "Candidates can view own assessment results" ON assessment_results
  FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can update own assessment results" ON assessment_results
  FOR UPDATE USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can insert own assessment results" ON assessment_results
  FOR INSERT WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Recruiters can view assessment results for their jobs" ON assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_results.job_id AND r.id = auth.uid()
    )
  );

-- Chat Messages
CREATE POLICY "Users can view their assessment chat messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_results ar
      WHERE ar.id = chat_messages.assessment_result_id
      AND ar.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their assessment chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessment_results ar
      WHERE ar.id = chat_messages.assessment_result_id
      AND ar.candidate_id = auth.uid()
    )
  );

-- Question Analysis
CREATE POLICY "Users can view their question analysis" ON question_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_results ar
      WHERE ar.id = question_analysis.assessment_result_id
      AND ar.candidate_id = auth.uid()
    )
  );

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
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_results_updated_at BEFORE UPDATE ON assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
