-- =============================================================================
-- LearnTiers — Migration 003: Add transcript to course_sections
-- =============================================================================

ALTER TABLE public.course_sections
ADD COLUMN IF NOT EXISTS transcript JSONB;

COMMENT ON COLUMN public.course_sections.transcript IS 'JSON array of objects containing start, end, and text for synchronized transcript.';
