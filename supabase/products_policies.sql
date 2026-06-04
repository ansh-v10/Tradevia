-- Public read access for storefront/catalog browsing.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Whitelist of admin emails allowed to write to the catalog.
CREATE TABLE IF NOT EXISTS public.admins (
  email text PRIMARY KEY
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'allow_select_all_products'
  ) THEN
    CREATE POLICY allow_select_all_products
    ON public.products
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'allow_insert_authenticated_products'
  ) THEN
    CREATE POLICY allow_insert_admin_products
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'allow_update_authenticated_products'
  ) THEN
    CREATE POLICY allow_update_admin_products
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'allow_delete_authenticated_products'
  ) THEN
    CREATE POLICY allow_delete_admin_products
    ON public.products
    FOR DELETE
    TO authenticated
    USING (public.is_admin());
  END IF;
END $$;

-- Note:
-- These policies require a signed-in Supabase Auth session.
-- Add each approved admin email to public.admins before they can write.