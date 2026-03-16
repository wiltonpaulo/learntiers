-- =============================================================================
-- LearnTiers — Migration 006: Add key_takeaways to course_sections
-- =============================================================================

ALTER TABLE public.course_sections
ADD COLUMN IF NOT EXISTS key_takeaways JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.course_sections.key_takeaways IS 'Array of AI-generated short text strings summarizing key points of the lesson.';
