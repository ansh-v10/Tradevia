CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY returns_select_own
ON public.returns
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE email = 'admin@tradevia.local'));

CREATE POLICY returns_insert_own
ON public.returns
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
