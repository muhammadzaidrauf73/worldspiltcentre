-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Brands are publicly readable" 
ON public.brands 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage brands" 
ON public.brands 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial brands
INSERT INTO public.brands (name, display_order) VALUES
  ('Pearl', 1),
  ('Grevox', 2),
  ('Orient', 3),
  ('Gree', 4),
  ('TCL', 5),
  ('Super General', 6),
  ('Haier', 7),
  ('Samsung', 8),
  ('Dawlance', 9),
  ('Pel', 10),
  ('Panasonic', 11),
  ('Kenwood', 12),
  ('Ecostar', 13),
  ('ChanghangRuba', 14),
  ('Hyundai', 15);