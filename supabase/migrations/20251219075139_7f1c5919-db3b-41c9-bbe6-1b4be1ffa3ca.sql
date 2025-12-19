-- Add colors column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';

-- Add a comment explaining the column
COMMENT ON COLUMN public.products.colors IS 'Array of color hex codes for product variants';