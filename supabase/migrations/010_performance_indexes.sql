-- Add missing indexes to improve performance of common queries

-- 1. Certificates: frequent lookup by user and course
CREATE INDEX IF NOT EXISTS idx_certificates_user_course ON public.certificates(user_id, course_id);

-- 2. User Progress: frequent lookup by user_id and section_id (though PK exists, explicit index can help in some plans or for filtering)
-- Actually user_progress already has PK (user_id, section_id) and index on user_id.

-- 3. Course Sections: order_index is used for sorting in almost every course page
CREATE INDEX IF NOT EXISTS idx_course_sections_order_index ON public.course_sections(order_index);

-- 4. Quizzes: already has index on section_id

-- 5. User Notes: already has index on user_id, section_id (from 005_user_notes.sql)
