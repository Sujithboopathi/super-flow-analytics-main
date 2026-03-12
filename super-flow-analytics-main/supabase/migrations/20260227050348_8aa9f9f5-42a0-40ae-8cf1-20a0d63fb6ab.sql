
-- Remove conflicting duplicate update policies on products
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can update product stock" ON public.products;

-- Single update policy: authenticated users can update products
CREATE POLICY "Authenticated can update products"
ON public.products FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
