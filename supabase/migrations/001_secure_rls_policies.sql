-- Migration: Secure RLS Policies
-- Run this on existing databases to fix security vulnerabilities
--
-- IMPORTANT: This migration removes the insecure "Anyone can view invitation by token"
-- policy and replaces it with proper recruiter-only access. Candidate access during
-- assessments is now handled by service role in API routes.

-- =====================================================
-- DROP INSECURE POLICIES
-- =====================================================

-- Remove the overly permissive invitation policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON assessment_invitations;

-- Remove old combined policies that may have security issues
DROP POLICY IF EXISTS "Access responses via session" ON question_responses;
DROP POLICY IF EXISTS "Access chat via session" ON chat_messages;
DROP POLICY IF EXISTS "Access template questions via template" ON template_questions;

-- =====================================================
-- ADD MISSING POLICIES
-- =====================================================

-- Recruiters can update invitations (resend, cancel)
DROP POLICY IF EXISTS "Recruiters can update invitations" ON assessment_invitations;
CREATE POLICY "Recruiters can update invitations" ON assessment_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN recruiters r ON r.company_id = j.company_id
      WHERE j.id = assessment_invitations.job_id AND r.user_id = auth.uid()
    )
  );

-- =====================================================
-- RECREATE POLICIES WITH PROPER SEPARATION
-- =====================================================

-- Template Questions: Recruiters only
DROP POLICY IF EXISTS "Recruiters can manage template questions" ON template_questions;
CREATE POLICY "Recruiters can manage template questions" ON template_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessment_templates t
      JOIN recruiters r ON r.company_id = t.company_id
      WHERE t.id = template_questions.template_id AND r.user_id = auth.uid()
    )
  );

-- Question Responses: Separate read policies for recruiters and candidates
DROP POLICY IF EXISTS "Recruiters can view responses" ON question_responses;
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

DROP POLICY IF EXISTS "Candidates can view own responses" ON question_responses;
CREATE POLICY "Candidates can view own responses" ON question_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN candidates c ON c.id = s.candidate_id
      WHERE s.id = question_responses.session_id AND c.user_id = auth.uid()
    )
  );

-- Chat Messages: Separate read policies for recruiters and candidates
DROP POLICY IF EXISTS "Recruiters can view chat messages" ON chat_messages;
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

DROP POLICY IF EXISTS "Candidates can view own chat" ON chat_messages;
CREATE POLICY "Candidates can view own chat" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_sessions s
      JOIN candidates c ON c.id = s.candidate_id
      WHERE s.id = chat_messages.session_id AND c.user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFY: List all policies (for manual verification)
-- =====================================================
-- Run this query after migration to verify policies:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
