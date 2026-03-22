-- Add slug column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to course_sections
ALTER TABLE public.course_sections ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_course_sections_slug ON public.course_sections(slug);

-- Add a unique constraint for slug within a course
-- First check if the constraint exists to avoid errors on re-run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_section_slug_per_course') THEN
        ALTER TABLE public.course_sections ADD CONSTRAINT unique_section_slug_per_course UNIQUE (course_id, slug);
    END IF;
END
$$;
