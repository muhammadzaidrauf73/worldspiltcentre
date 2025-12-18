-- Fix products RLS policy for INSERT operations
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));