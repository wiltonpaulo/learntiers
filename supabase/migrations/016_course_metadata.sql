-- Add metadata columns to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_path VARCHAR(255);

-- Update existing records with default values if necessary
UPDATE courses SET level = 'Beginner' WHERE level IS NULL;
UPDATE courses SET skills = '[]'::jsonb WHERE skills IS NULL;
