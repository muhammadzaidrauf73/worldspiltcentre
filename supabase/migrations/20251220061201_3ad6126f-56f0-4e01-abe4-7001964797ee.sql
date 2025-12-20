-- Enable realtime for order_status_history table
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;