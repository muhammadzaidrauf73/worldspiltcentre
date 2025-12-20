-- Create order status history table
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own order status history
CREATE POLICY "Users can view their own order status history"
ON public.order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Admins can manage all status history
CREATE POLICY "Admins can manage order status history"
ON public.order_status_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Create trigger to automatically record status changes
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT, record initial status
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Order placed');
    RETURN NEW;
  END IF;
  
  -- On UPDATE, record status change if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, NULL);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
CREATE TRIGGER on_order_status_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.record_order_status_change();