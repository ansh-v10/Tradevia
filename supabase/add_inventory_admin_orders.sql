-- Add inventory/stock column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory integer DEFAULT 100;

-- Add raw_subtotal column to orders table for frontend mapping
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS raw_subtotal numeric DEFAULT 0;

-- Allow admin users to select all orders
CREATE POLICY orders_select_admin
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admin users to update any order
CREATE POLICY orders_update_admin
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RPC function to atomically decrement product inventory
CREATE OR REPLACE FUNCTION public.decrement_product_inventory(product_id integer, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET inventory = GREATEST(0, COALESCE(inventory, 100) - quantity)
  WHERE id = product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(integer, integer) TO authenticated;
