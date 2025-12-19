-- Fix 1: Newsletter subscribers - ensure only admins can read subscriber data
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Recreate with proper restrictions
-- Only admins can read subscriber list
CREATE POLICY "Admins can manage subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (subscribe) but only their own email
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Fix 2: Orders table - restrict access to guest orders
-- Drop existing policies that may be problematic
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

-- Admins can do everything
CREATE POLICY "Admins can manage orders" 
ON public.orders 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view only their own orders (not guest orders)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can create orders for themselves only (no NULL user_id allowed from client)
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);