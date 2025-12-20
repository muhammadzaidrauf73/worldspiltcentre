-- Create order cancellation requests table
CREATE TABLE public.order_cancellation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Users can create cancellation requests for their own orders
CREATE POLICY "Users can create cancellation requests"
ON public.order_cancellation_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own cancellation requests
CREATE POLICY "Users can view their own cancellation requests"
ON public.order_cancellation_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all cancellation requests
CREATE POLICY "Admins can manage cancellation requests"
ON public.order_cancellation_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_order_cancellation_requests_updated_at
BEFORE UPDATE ON public.order_cancellation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();