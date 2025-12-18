-- Add button_color column to promotional_banners
ALTER TABLE public.promotional_banners 
ADD COLUMN button_color text DEFAULT '#f97316';