-- Add is_on_sale column to products table
ALTER TABLE public.products 
ADD COLUMN is_on_sale boolean DEFAULT false;