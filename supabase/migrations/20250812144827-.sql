-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Gifts are viewable by everyone" ON public.gifts;

-- Allow users to view their own gifts
CREATE POLICY "Users can view their own gifts" 
ON public.gifts 
FOR SELECT 
USING (auth.uid() = user_id);

-- For anonymous gifts (user_id is NULL), we need a different approach
-- Add a column to control public sharing
ALTER TABLE public.gifts 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Allow public access only to gifts explicitly marked as public
CREATE POLICY "Public gifts are viewable when marked as such" 
ON public.gifts 
FOR SELECT 
USING (is_public = true AND user_id IS NULL);

-- Update existing gifts to maintain current sharing functionality
-- Set anonymous gifts (user_id IS NULL) as public to maintain current behavior
UPDATE public.gifts 
SET is_public = true 
WHERE user_id IS NULL;