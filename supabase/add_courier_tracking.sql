ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier text DEFAULT '';

CREATE OR REPLACE FUNCTION mark_order_shipped(order_id text, tracking text, courier_name text DEFAULT '')
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.orders
  SET status = 'shipped', tracking_number = tracking, courier = courier_name, shipped_at = now()
  WHERE id = order_id AND status = 'paid';
$$;
