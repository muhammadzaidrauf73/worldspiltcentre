-- Offline receipts history table
CREATE TABLE public.offline_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  payment_method TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offline_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage offline receipts"
  ON public.offline_receipts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_offline_receipts_updated_at
  BEFORE UPDATE ON public.offline_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_offline_receipts_created_at ON public.offline_receipts (created_at DESC);

-- Atomic stock decrement function (admin only). Accepts an array of {product_id, quantity}.
CREATE OR REPLACE FUNCTION public.decrement_product_stock(_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT (elem->>'product_id')::UUID AS pid,
           COALESCE((elem->>'quantity')::INT, 0) AS qty
    FROM jsonb_array_elements(_items) AS elem
    WHERE elem ? 'product_id' AND elem->>'product_id' <> ''
  LOOP
    IF rec.qty > 0 THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - rec.qty)
      WHERE id = rec.pid;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(JSONB) TO authenticated, service_role;