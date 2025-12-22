-- Create notifications table for customer notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, promo
  link TEXT,
  is_global BOOLEAN DEFAULT true,
  user_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Global notifications are publicly readable
CREATE POLICY "Global notifications are publicly readable"
ON public.notifications
FOR SELECT
USING (is_global = true AND (expires_at IS NULL OR expires_at > now()));

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user notification reads table to track which global notifications a user has read
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Enable RLS on user_notification_reads
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own reads
CREATE POLICY "Users can view their own notification reads"
ON public.user_notification_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reads
CREATE POLICY "Users can insert their own notification reads"
ON public.user_notification_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert some sample notifications
INSERT INTO public.notifications (title, message, type, link, is_global) VALUES
('Welcome to World Spilt Centre!', 'Explore our wide range of premium electronics with the best prices in Pakistan.', 'info', '/products', true),
('Summer Sale is Live!', 'Get up to 50% off on Air Conditioners. Limited time offer!', 'promo', '/products?category=Air Conditioners', true),
('New Arrivals', 'Check out our latest collection of Smart TVs and Home Appliances.', 'success', '/products?new=true', true);