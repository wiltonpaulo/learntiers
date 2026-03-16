-- =============================================================================
-- LearnTiers — Migration 009: Fix Certificate User Relationship
-- =============================================================================

-- Drop the old foreign key that points to auth.users
ALTER TABLE public.certificates 
DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;

-- Add a new foreign key that points to public.users
-- This allows PostgREST to recognize the relationship for joins
ALTER TABLE public.certificates
ADD CONSTRAINT certificates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;
