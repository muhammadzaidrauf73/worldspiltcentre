-- Fix: Only show approved reviews publicly (unapproved reviews visible to admins only)
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.product_reviews;

CREATE POLICY "Approved reviews are publicly readable" 
ON public.product_reviews 
FOR SELECT 
USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);