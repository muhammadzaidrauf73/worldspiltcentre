-- Create shipping_settings table
CREATE TABLE public.shipping_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_order_amount NUMERIC,
  is_active BOOLEAN DEFAULT true,
  is_free_shipping BOOLEAN DEFAULT false,
  free_shipping_threshold NUMERIC,
  estimated_days TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shipping settings are publicly readable"
ON public.shipping_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage shipping settings"
ON public.shipping_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_shipping_settings_updated_at
BEFORE UPDATE ON public.shipping_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shipping options
INSERT INTO public.shipping_settings (name, description, price, is_active, estimated_days, free_shipping_threshold) VALUES
('Standard Delivery', 'Delivery within 5-7 business days', 200, true, '5-7 days', 10000),
('Express Delivery', 'Delivery within 2-3 business days', 500, true, '2-3 days', null),
('Same Day Delivery', 'Delivery on the same day (order before 12 PM)', 1000, true, 'Same day', null);