-- Add policy for guest order viewing with email verification (done via RPC)
-- Create a function to verify guest order access
CREATE OR REPLACE FUNCTION public.verify_guest_order(order_id_param uuid, email_param text)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  customer_email text,
  customer_name text,
  customer_phone text,
  shipping_address text,
  status text,
  total numeric,
  tracking_number text,
  tracking_url text,
  updated_at timestamptz,
  user_id uuid,
  items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.customer_email,
    o.customer_name,
    o.customer_phone,
    o.shipping_address,
    o.status,
    o.total,
    o.tracking_number,
    o.tracking_url,
    o.updated_at,
    o.user_id,
    o.items
  FROM orders o
  WHERE o.id = order_id_param 
    AND o.user_id IS NULL 
    AND LOWER(o.customer_email) = LOWER(email_param);
END;
$$;

-- Create function to get guest order status history
CREATE OR REPLACE FUNCTION public.get_guest_order_history(order_id_param uuid, email_param text)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  status text,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First verify the order belongs to this email
  IF EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_id_param 
      AND o.user_id IS NULL 
      AND LOWER(o.customer_email) = LOWER(email_param)
  ) THEN
    RETURN QUERY
    SELECT 
      h.id,
      h.order_id,
      h.status,
      h.notes,
      h.created_at
    FROM order_status_history h
    WHERE h.order_id = order_id_param
    ORDER BY h.created_at ASC;
  END IF;
END;
$$;