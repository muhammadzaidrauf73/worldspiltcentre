-- Create homepage sections table for controlling section visibility and order
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Homepage sections are publicly readable"
ON public.homepage_sections
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sections
INSERT INTO public.homepage_sections (section_key, section_name, display_order, is_visible) VALUES
('hero', 'Hero Banner', 1, true),
('categories', 'Shop by Category', 2, true),
('flash_deals', 'Flash Deals', 3, true),
('new_arrivals', 'New Arrivals', 4, true),
('top_sellers', 'Top Sellers', 5, true),
('features', 'Features Bar', 6, true),
('brands', 'Featured Brands', 7, true),
('reviews', 'Customer Reviews', 8, true),
('newsletter', 'Newsletter', 9, true),
('faq', 'FAQ', 10, true);

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();