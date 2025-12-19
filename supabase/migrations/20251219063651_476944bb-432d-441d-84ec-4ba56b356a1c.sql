
-- Add new columns to product_reviews for Pakistani reviews with images
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
ADD COLUMN IF NOT EXISTS reviewer_location TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Allow admins to create reviews on behalf of customers
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.product_reviews;
CREATE POLICY "Admins can manage all reviews" 
ON public.product_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));
