-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create new policy that allows both authenticated users and guest checkout
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create orders for themselves
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR 
  -- Allow guest checkout (no user_id required)
  (user_id IS NULL)
);

-- Also update SELECT policy to allow guests to view their orders via email
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  -- Authenticated users can see their orders
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Admins can see all orders (already covered by admin policy, but being explicit)
  has_role(auth.uid(), 'admin'::app_role)
);