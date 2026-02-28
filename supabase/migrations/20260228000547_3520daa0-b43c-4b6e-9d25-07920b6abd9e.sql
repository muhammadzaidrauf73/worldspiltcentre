
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon text DEFAULT '💳',
  logo_url text,
  account_title text,
  account_number text,
  iban text,
  bank_name text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment methods are publicly readable" ON public.payment_methods
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed existing payment methods
INSERT INTO public.payment_methods (method_key, label, description, icon, account_title, account_number, iban, bank_name, display_order) VALUES
  ('cod', 'Cash on Delivery', 'Pay when you receive your order', '💵', NULL, NULL, NULL, NULL, 0),
  ('jazzcash', 'JazzCash', 'Pay via JazzCash mobile wallet', '📱', 'Khalil Ahmad', '03004649141', NULL, 'JazzCash', 1),
  ('easypaisa', 'EasyPaisa', 'Pay via EasyPaisa mobile wallet', '📱', 'Khalil Ahmad', '03004649141', NULL, 'EasyPaisa', 2),
  ('meezan', 'Meezan Bank', 'Pay via Meezan Bank transfer', '🏦', 'Khalil Ahmad', '02810110983695', 'PK19MEZN0002810110983695', 'Meezan Bank', 3);
