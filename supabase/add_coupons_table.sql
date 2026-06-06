CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL CHECK (value > 0),
  min_order_value numeric DEFAULT 0,
  usage_limit integer DEFAULT 0,
  used_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a coupon by code to validate it
CREATE POLICY coupons_select_all
ON public.coupons
FOR SELECT
TO anon, authenticated
USING (true);

-- RPC to increment coupon usage count (called by authenticated users)
CREATE OR REPLACE FUNCTION increment_coupon_used(cid uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = cid;
$$;
