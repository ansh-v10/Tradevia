-- Mark delivered
CREATE OR REPLACE FUNCTION mark_order_delivered(order_id text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.orders SET status = 'delivered', delivered_at = now()
  WHERE id = order_id AND status = 'shipped';
$$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

-- Cancel order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason text;

CREATE OR REPLACE FUNCTION cancel_order(order_id text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.orders SET status = 'cancelled', cancelled_at = now()
  WHERE id = order_id AND status IN ('pending', 'paid');
$$;

-- Restore inventory on cancellation
CREATE OR REPLACE FUNCTION cancel_order_and_restore(order_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_items jsonb;
  item jsonb;
BEGIN
  SELECT items INTO order_items FROM public.orders WHERE id = order_id;
  UPDATE public.orders SET status = 'cancelled', cancelled_at = now()
  WHERE id = order_id AND status IN ('pending', 'paid');
  IF order_items IS NOT NULL THEN
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
      UPDATE public.products
      SET inventory = COALESCE(inventory, 100) + (item->>'quantity')::int
      WHERE id = (item->>'id')::int;
    END LOOP;
  END IF;
END;
$$;

-- Product variants
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- Back-in-stock requests
CREATE TABLE IF NOT EXISTS public.back_in_stock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  notified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.back_in_stock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY back_in_stock_requests_insert
ON public.back_in_stock_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY back_in_stock_requests_select_admin
ON public.back_in_stock_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Delivered status in customer_email column already exists
