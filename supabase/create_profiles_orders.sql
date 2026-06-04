-- Create profiles table for storing user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  business_name text,
  mobile text,
  created_at timestamp with time zone default now()
);

-- Allow authenticated users to insert/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_authenticated_upsert
ON public.profiles
FOR ALL
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Orders table and order_items
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  user_id uuid,
  status text,
  amount numeric,
  gst numeric,
  discount numeric,
  items jsonb,
  address jsonb,
  created_at timestamp with time zone default now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create orders for themselves and read their orders
CREATE POLICY orders_insert_authenticated
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id::text::uuid OR user_id IS NULL);

CREATE POLICY orders_select_own
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id::text::uuid OR user_id IS NULL);

-- Webhook/Service role updates will bypass RLS by using service role key
