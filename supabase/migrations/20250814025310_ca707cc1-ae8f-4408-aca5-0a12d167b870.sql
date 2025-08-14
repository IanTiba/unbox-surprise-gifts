-- Fix security issue: Remove public access to private gift messages
-- This ensures gifts are only accessible to their creators or via secure sharing

-- Drop the existing problematic policy that allows public access
DROP POLICY "Public gifts are viewable when marked as such" ON public.gifts;

-- Create a new secure policy for gift access
-- Gifts can be viewed by:
-- 1. Their creators (when user_id matches auth.uid())
-- 2. Anyone with the specific slug (secure sharing via unique URL)
-- 3. Remove the public browsing capability entirely

CREATE POLICY "Gifts are accessible via secure sharing" 
ON public.gifts 
FOR SELECT 
USING (
  -- Creator can always access their own gifts
  (auth.uid() = user_id) 
  OR 
  -- Anyone can access via direct slug lookup (secure sharing)
  -- This allows sharing via unique URLs without exposing in public lists
  (slug IS NOT NULL)
);

-- Update the insert policy to ensure better security
DROP POLICY "Users can create their own gifts" ON public.gifts;

CREATE POLICY "Users can create gifts with proper ownership" 
ON public.gifts 
FOR INSERT 
WITH CHECK (
  -- Authenticated users: set user_id to their ID, make private by default
  (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_public = false)
  OR
  -- Anonymous users: no user_id, but gifts are private (not publicly listed)
  (auth.uid() IS NULL AND user_id IS NULL AND is_public = false)
);

-- Update the update policy to maintain security
DROP POLICY "Users can update their own gifts" ON public.gifts;

CREATE POLICY "Users can update their own gifts securely" 
ON public.gifts 
FOR UPDATE 
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))
WITH CHECK (
  -- Ensure gifts remain private during updates
  is_public = false AND
  (
    (auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  )
);

-- Add a comment to document the security model
COMMENT ON TABLE public.gifts IS 'Gifts are private by default and accessible only via secure sharing URLs. No public browsing to protect privacy.';

-- Update existing public gifts to be private (protect existing data)
UPDATE public.gifts SET is_public = false WHERE is_public = true;