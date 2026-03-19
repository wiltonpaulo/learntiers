-- Add playground_code column to course_sections
ALTER TABLE public.course_sections 
ADD COLUMN IF NOT EXISTS playground_code TEXT;

COMMENT ON COLUMN public.course_sections.playground_code IS 'Initial React code for the interactive playground tab.';
