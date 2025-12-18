-- Add tracking_number and tracking_url columns to orders table
ALTER TABLE public.orders 
ADD COLUMN tracking_number TEXT,
ADD COLUMN tracking_url TEXT;