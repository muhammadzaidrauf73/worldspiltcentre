-- Create function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons 
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = coupon_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) TO authenticated;