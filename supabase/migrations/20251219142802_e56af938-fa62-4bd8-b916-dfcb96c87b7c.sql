-- Drop the overly permissive policy that allows anyone to upload
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;

-- Create a new policy that only allows admins to upload review images
CREATE POLICY "Admins can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);