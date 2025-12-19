-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public read access for active FAQs
CREATE POLICY "FAQs are publicly readable"
ON public.faqs
FOR SELECT
USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage FAQs"
ON public.faqs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('What is your return policy?', 'We offer a 7-day return policy for all products in their original condition. Electronics must be unopened or defective for full refund. Contact our support team to initiate a return.', 1),
('Do you offer installation services?', 'Yes! We provide free installation for select appliances including ACs, washing machines, and large TVs. Our trained technicians will set up your product at your convenience.', 2),
('What warranty do you provide?', 'All products come with manufacturer warranty (typically 1-2 years). We also offer extended warranty plans for additional coverage up to 5 years at competitive prices.', 3),
('How long does delivery take?', 'Standard delivery takes 3-5 business days nationwide. Express delivery (1-2 days) is available for major cities. Large appliances may require scheduled delivery.', 4),
('Do you price match competitors?', 'Absolutely! If you find a lower price at an authorized retailer, we''ll match it. Just show us the competitor''s price and we''ll adjust your order accordingly.', 5),
('What payment methods do you accept?', 'We accept all major credit/debit cards, bank transfers, JazzCash, Easypaisa, and Cash on Delivery (COD). EMI options are available on select products.', 6);