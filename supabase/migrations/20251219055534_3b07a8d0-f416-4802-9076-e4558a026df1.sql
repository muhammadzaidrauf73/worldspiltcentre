-- Create table to track coupon usage per user
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  order_total NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(coupon_id, user_id, order_id)
);

-- Enable RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can record their own coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all coupon usage"
ON public.coupon_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all usage
CREATE POLICY "Admins can manage coupon usage"
ON public.coupon_usage
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add max_uses_per_user column to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_used_at ON public.coupon_usage(used_at);