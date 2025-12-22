-- Create store_locations table for calculating delivery distance
CREATE TABLE public.store_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Store locations are publicly readable" 
ON public.store_locations 
FOR SELECT 
USING (true);

-- Admin management
CREATE POLICY "Admins can manage store locations" 
ON public.store_locations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_store_locations_updated_at
BEFORE UPDATE ON public.store_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a sample store location (you can update this later)
INSERT INTO public.store_locations (name, address, latitude, longitude, city, phone)
VALUES 
  ('Main Store', 'Main Branch, Lahore', 31.5204, 74.3587, 'Lahore', '+92-300-1234567'),
  ('Karachi Branch', 'Karachi Branch', 24.8607, 67.0011, 'Karachi', '+92-300-7654321'),
  ('Islamabad Branch', 'Islamabad Branch', 33.6844, 73.0479, 'Islamabad', '+92-300-1122334');