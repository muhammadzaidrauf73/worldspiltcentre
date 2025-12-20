-- Update the trigger function to add automatic notes based on status
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auto_note TEXT;
BEGIN
  -- On INSERT, record initial status
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Order placed successfully');
    RETURN NEW;
  END IF;
  
  -- On UPDATE, record status change if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Set automatic notes based on status
    CASE NEW.status
      WHEN 'confirmed' THEN
        auto_note := 'Your order has been confirmed';
      WHEN 'processing' THEN
        auto_note := 'Packing your order';
      WHEN 'shipped' THEN
        auto_note := 'Your order is on the way';
      WHEN 'delivered' THEN
        auto_note := 'Your order has been delivered';
      WHEN 'cancelled' THEN
        auto_note := 'Order has been cancelled';
      ELSE
        auto_note := NULL;
    END CASE;
    
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, auto_note);
  END IF;
  
  RETURN NEW;
END;
$$;