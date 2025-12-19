-- Add new arrival and top seller flags to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_top_seller boolean DEFAULT false;