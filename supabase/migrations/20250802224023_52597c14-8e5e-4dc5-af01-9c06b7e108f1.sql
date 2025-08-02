-- Create gifts table to store all gift box data
CREATE TABLE public.gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '🎁',
  theme TEXT DEFAULT 'purple-pink',
  has_confetti BOOLEAN DEFAULT true,
  has_background_music BOOLEAN DEFAULT false,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create policies for gifts access
CREATE POLICY "Gifts are viewable by everyone" 
ON public.gifts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own gifts" 
ON public.gifts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own gifts" 
ON public.gifts 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(title_input TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug format
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title_input, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Trim to max 40 characters and remove trailing dashes
  base_slug := TRIM(TRAILING '-' FROM LEFT(base_slug, 40));
  
  -- Check if slug exists and increment counter if needed
  final_slug := base_slug;
  
  WHILE EXISTS(SELECT 1 FROM public.gifts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;