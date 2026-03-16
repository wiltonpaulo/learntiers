-- =============================================================================
-- LearnTiers — Migration 008: Certificate Policies Fix
-- =============================================================================

-- Allow authenticated users to insert their own certificates 
-- (This is needed because the server action runs in the user context)
CREATE POLICY "Users can insert own certificates" 
ON public.certificates FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Also allow update (though upsert is what we use)
CREATE POLICY "Users can update own certificates" 
ON public.certificates FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id);
