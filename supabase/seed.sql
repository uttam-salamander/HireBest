-- Sample Data for HireBest
-- Run this AFTER running schema.sql to populate with test data

-- Insert sample companies
INSERT INTO companies (id, name, description, industry) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'TechFlow Inc.', 'Leading software development company', 'Technology'),
  ('550e8400-e29b-41d4-a716-446655440002', 'DataVerse Analytics', 'Data analytics and insights platform', 'Data Science');

-- Insert sample jobs
INSERT INTO jobs (id, title, company_id, description, job_type, status) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Frontend Developer Intern', '550e8400-e29b-41d4-a716-446655440001', 'Join our team to build amazing web applications', 'internship', 'active'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Data Analyst Intern', '550e8400-e29b-41d4-a716-446655440002', 'Analyze data and create insights', 'internship', 'active');

-- Insert sample assessments
INSERT INTO assessments (id, job_id, title, instructions, total_questions) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Frontend Developer Assessment', 'This assessment will evaluate your frontend development skills through conversational questions.', 8),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Data Analyst Assessment', 'This assessment will evaluate your data analysis skills.', 6);

-- Note: Candidates and assessment results need to be created through the application
-- as they require auth.users entries which are created during signup
