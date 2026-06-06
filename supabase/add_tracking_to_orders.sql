ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;

CREATE OR REPLACE FUNCTION mark_order_shipped(order_id text, tracking text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.orders
  SET status = 'shipped', tracking_number = tracking, shipped_at = now()
  WHERE id = order_id AND status = 'paid';
$$;
