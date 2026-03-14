-- =============================================================================
-- LearnTiers — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLE: users
-- Extends Supabase auth.users. Stores public profile + gamification data.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  total_score   INTEGER     NOT NULL DEFAULT 0,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users                IS 'Public user profiles linked to Supabase Auth.';
COMMENT ON COLUMN public.users.total_score    IS 'Accumulated gamification score across all courses.';


-- =============================================================================
-- TABLE: courses
-- Top-level learning unit. A course is composed of ordered sections.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS 'A curated course consisting of multiple YouTube video sections.';


-- =============================================================================
-- TABLE: course_sections
-- ★ Core business rule: each section maps a YouTube video ID + a precise
--   [start_time_seconds, end_time_seconds] window — the "slice".
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.course_sections (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  yt_video_id         TEXT        NOT NULL,           -- e.g. "dQw4w9WgXcQ"
  start_time_seconds  INTEGER     NOT NULL CHECK (start_time_seconds >= 0),
  end_time_seconds    INTEGER     NOT NULL CHECK (end_time_seconds > start_time_seconds),
  text_summary        TEXT,
  order_index         INTEGER     NOT NULL DEFAULT 0, -- display order within the course
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course_id
  ON public.course_sections(course_id);

COMMENT ON TABLE  public.course_sections                    IS 'A sliced segment of a YouTube video that forms a single micro-lesson.';
COMMENT ON COLUMN public.course_sections.yt_video_id        IS 'YouTube video ID (11-char string).';
COMMENT ON COLUMN public.course_sections.start_time_seconds IS 'Second at which playback begins for this micro-lesson.';
COMMENT ON COLUMN public.course_sections.end_time_seconds   IS 'Second at which playback must stop — player fires onSectionEnd here.';


-- =============================================================================
-- TABLE: quizzes
-- One quiz question per section. options_json stores the answer choices array.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id           UUID    NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  question_text        TEXT    NOT NULL,
  options_json         JSONB   NOT NULL,  -- string[]  e.g. ["Option A", "Option B", "Option C"]
  correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (section_id) -- one quiz per section (extend to many later if needed)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_section_id
  ON public.quizzes(section_id);

COMMENT ON TABLE  public.quizzes                      IS 'Quiz question shown after a student completes a course section.';
COMMENT ON COLUMN public.quizzes.options_json         IS 'JSON array of answer strings, e.g. ["React", "Vue", "Angular"].';
COMMENT ON COLUMN public.quizzes.correct_answer_index IS 'Zero-based index into options_json pointing to the correct answer.';


-- =============================================================================
-- TABLE: user_progress
-- Composite PK. Tracks completion + quiz score per user per section.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id      UUID    NOT NULL REFERENCES public.users(id)           ON DELETE CASCADE,
  section_id   UUID    NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  quiz_score   INTEGER          CHECK (quiz_score >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
  ON public.user_progress(user_id);

COMMENT ON TABLE  public.user_progress             IS 'Records whether a user completed a section and their quiz score.';
COMMENT ON COLUMN public.user_progress.quiz_score  IS 'Points earned on the section quiz. NULL = quiz not yet attempted.';


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress  ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────────────────────

CREATE POLICY "users: public read"
  ON public.users FOR SELECT
  USING (TRUE);

CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── courses ───────────────────────────────────────────────────────────────────

CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT
  USING (TRUE);

-- Only service_role (backend / admin) can INSERT/UPDATE/DELETE courses.
-- No permissive policy needed — default deny covers it.

-- ── course_sections ───────────────────────────────────────────────────────────

CREATE POLICY "course_sections: public read"
  ON public.course_sections FOR SELECT
  USING (TRUE);

-- ── quizzes ───────────────────────────────────────────────────────────────────

CREATE POLICY "quizzes: public read"
  ON public.quizzes FOR SELECT
  USING (TRUE);

-- ── user_progress ─────────────────────────────────────────────────────────────

CREATE POLICY "user_progress: read own"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress: insert own"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress: update own"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- TRIGGER: auto-create user profile on auth.users INSERT
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
