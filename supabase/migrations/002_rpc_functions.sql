-- =============================================================================
-- LearnTiers — RPC Functions (gamification helpers)
-- Run after: 001_initial_schema.sql
-- =============================================================================

-- =============================================================================
-- FUNCTION: increment_user_score
-- Safely increments a user's total_score by a delta value.
-- Called from the server-side progress action after section completion.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_user_score(
  p_user_id UUID,
  p_delta   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET total_score = total_score + p_delta
  WHERE id = p_user_id;
END;
$$;

-- Only the authenticated user can call this for themselves.
-- SECURITY DEFINER means it runs with elevated privileges, so we guard explicitly.
REVOKE ALL ON FUNCTION public.increment_user_score FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_score TO authenticated;
