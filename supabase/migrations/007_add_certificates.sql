-- =============================================================================
-- LearnTiers — Migration 007: Certificates of Completion
-- =============================================================================

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL UNIQUE DEFAULT lower(substring(md5(random()::text) from 1 for 12)),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent multiple certificates for same user/course
  CONSTRAINT unique_user_course_cert UNIQUE (user_id, course_id)
);

-- RLS Policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own certificates
CREATE POLICY "Users can view own certificates" 
ON public.certificates FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Public can view certificate by verification_code (for verification)
CREATE POLICY "Public can view certificate by code" 
ON public.certificates FOR SELECT 
TO anon, authenticated 
USING (true);

COMMENT ON TABLE public.certificates IS 'Stores issued course completion certificates for users.';
