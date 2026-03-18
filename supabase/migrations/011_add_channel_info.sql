-- Add YouTube channel info to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS youtube_channel_name TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT;
