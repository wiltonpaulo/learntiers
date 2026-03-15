-- =============================================================================
-- LearnTiers — Migration 004: Move transcript to courses table
-- =============================================================================

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS transcript JSONB;

COMMENT ON COLUMN public.courses.transcript IS 'JSON array of objects containing start, end, and text for the entire course transcript.';

-- Optional: we could remove it from course_sections, but let's keep it for compatibility for now
-- or until we are sure everything is migrated.
