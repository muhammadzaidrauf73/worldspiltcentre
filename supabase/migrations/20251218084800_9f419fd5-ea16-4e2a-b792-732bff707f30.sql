-- Create flash_deals table
CREATE TABLE public.flash_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_price NUMERIC NOT NULL,
  deal_price NUMERIC NOT NULL,
  image_url TEXT,
  sold_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Flash deals are publicly readable" 
ON public.flash_deals 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage flash deals" 
ON public.flash_deals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_flash_deals_updated_at
BEFORE UPDATE ON public.flash_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();