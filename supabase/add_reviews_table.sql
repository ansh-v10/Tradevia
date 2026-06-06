CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select_all
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY reviews_insert_own
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION get_product_rating(p_product_id integer)
RETURNS TABLE(average_rating numeric, review_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(AVG(rating)::numeric(3,2), 0), COUNT(*)
  FROM public.reviews
  WHERE product_id = p_product_id;
$$;
