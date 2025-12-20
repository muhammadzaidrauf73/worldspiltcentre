-- Drop the unused increment_coupon_usage function that poses a security risk
-- The application already handles coupon updates via direct RLS-protected queries
DROP FUNCTION IF EXISTS public.increment_coupon_usage(uuid);