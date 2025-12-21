-- Add free_delivery column to products table
ALTER TABLE public.products ADD COLUMN is_free_delivery boolean DEFAULT false;