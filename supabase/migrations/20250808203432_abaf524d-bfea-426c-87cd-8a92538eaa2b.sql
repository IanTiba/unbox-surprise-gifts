-- Create storage bucket for gift media
INSERT INTO storage.buckets (id, name, public) VALUES ('gift-media', 'gift-media', true);

-- Create policies for gift media bucket
CREATE POLICY "Gift media images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gift-media');

CREATE POLICY "Anyone can upload gift media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gift-media');

CREATE POLICY "Anyone can update gift media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gift-media');