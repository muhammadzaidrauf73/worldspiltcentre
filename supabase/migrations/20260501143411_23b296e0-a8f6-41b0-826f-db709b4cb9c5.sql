-- Sequential receipt numbering starting at 108
CREATE SEQUENCE IF NOT EXISTS public.offline_receipt_seq START WITH 108 INCREMENT BY 1;

-- Make sure the sequence is at least 108 even if it already exists
SELECT setval('public.offline_receipt_seq', GREATEST(108, (SELECT COALESCE(last_value, 108) FROM public.offline_receipt_seq)), true);

CREATE OR REPLACE FUNCTION public.next_receipt_number()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.offline_receipt_seq')::integer;
$$;

GRANT EXECUTE ON FUNCTION public.next_receipt_number() TO authenticated;