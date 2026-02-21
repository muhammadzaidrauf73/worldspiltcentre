
-- Drop existing restrictive policies on orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))
  OR (user_id IS NULL)
);

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);
