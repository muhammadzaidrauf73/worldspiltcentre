-- Create company settings table
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Company settings are publicly readable"
ON public.company_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage company settings"
ON public.company_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.company_settings (key, value, label, category) VALUES
('company_name', 'World Spilt Centre', 'Company Name', 'general'),
('tagline', 'Electronics', 'Tagline', 'general'),
('phone', '0300-4649141', 'Phone Number', 'contact'),
('email', 'support@worldspiltcentre.com', 'Email Address', 'contact'),
('whatsapp', '923004649141', 'WhatsApp Number', 'contact'),
('address', 'Shop # 30 Saleem Complex, Q Block (Ext) Near Kashmir Bakers, Model Town, Lahore', 'Store Address', 'contact'),
('about_us', '', 'About Us Page Content', 'pages'),
('terms_conditions', '', 'Terms & Conditions', 'pages'),
('privacy_policy', '', 'Privacy Policy', 'pages'),
('return_policy', '', 'Return Policy', 'pages'),
('facebook_url', '', 'Facebook URL', 'social'),
('instagram_url', '', 'Instagram URL', 'social'),
('youtube_url', '', 'YouTube URL', 'social'),
('twitter_url', '', 'Twitter/X URL', 'social');