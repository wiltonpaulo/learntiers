-- Add last_viewed_section_id to user_progress or similar tracking table
-- In our schema, we can use a separate table for cleaner tracking of "Last Position"
CREATE TABLE IF NOT EXISTS public.user_course_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  last_section_id UUID REFERENCES public.course_sections(id) ON DELETE SET NULL,
  last_time_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.user_course_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own course settings" 
  ON public.user_course_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own course settings" 
  ON public.user_course_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course settings update" 
  ON public.user_course_settings FOR UPDATE
  USING (auth.uid() = user_id);
