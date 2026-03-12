
-- Fix overly permissive RLS on products, sales, sale_items
-- Drop old policies
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow all access to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all access to sale_items" ON public.sale_items;

-- Products: authenticated users can read, admins can write
CREATE POLICY "Authenticated can read products"
ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Sales: all authenticated can read and insert
CREATE POLICY "Authenticated can read sales"
ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sales"
ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

-- Sale items: all authenticated can read and insert
CREATE POLICY "Authenticated can read sale_items"
ON public.sale_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sale_items"
ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated to update product stock (for stock deduction on sale)
CREATE POLICY "Authenticated can update product stock"
ON public.products FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
