
-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

-- Allow public read access
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- Allow authenticated users to upload review images
CREATE POLICY "Anyone can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete review images"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-images');
