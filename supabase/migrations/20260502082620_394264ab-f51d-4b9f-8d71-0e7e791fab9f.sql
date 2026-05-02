-- Add cost_price to products for profit tracking
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.cost_price IS 'Purchase/wholesale cost per unit. Used to compute profit = (sale_price - cost_price) * qty.';