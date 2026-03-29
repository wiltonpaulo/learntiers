-- Rename learning_path to suggested_track for consistency in English
ALTER TABLE courses RENAME COLUMN learning_path TO suggested_track;
