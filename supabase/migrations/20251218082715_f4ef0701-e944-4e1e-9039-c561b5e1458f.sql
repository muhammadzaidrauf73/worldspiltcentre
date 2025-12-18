-- Create promotional_banners table
CREATE TABLE public.promotional_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT DEFAULT '/products',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Banners are publicly readable"
ON public.promotional_banners
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage banners"
ON public.promotional_banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_promotional_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial banners
INSERT INTO public.promotional_banners (title, subtitle, description, image_url, link, display_order) VALUES
('Consistent Cleaning Every Time', 'UP TO 15% OFF', 'Premium Washing Machines with Advanced Features', '/banners/washing-machine.jpg', '/products?category=Washing%20Machines', 1),
('Simplifying Cooking Everyday', 'SMALL APPLIANCES', 'Quality Kitchen Appliances for Modern Homes', '/banners/small-appliances.jpg', '/products?category=Small%20Appliances', 2),
('Bring Every Scene To Life', 'LED TVs', 'Crystal Clear Display with Smart Features', '/banners/led-tv.jpg', '/products?category=LED%20TV', 3),
('Pure Air Pure Living', 'AIR PURIFIERS', 'Cleaner Air Every Moment Everywhere', '/banners/air-purifier.webp', '/products?category=Air%20Purifier', 4),
('Comfort You Can Feel', 'UP TO 30% OFF', 'Quality Geysers Starting From Rs 17,499', '/banners/geyser.jpg', '/products?category=Geyser', 5),
('Your Shortcut To Warm Food', 'UP TO 10% OFF', 'Premium Microwave Ovens', '/banners/microwave.jpg', '/products?category=Microwave', 6),
('Pure Water Pure Refreshment', 'WATER DISPENSERS', 'Quality Water Dispensers for Your Home', '/banners/water-dispenser.jpg', '/products?category=Water%20Dispenser', 7);