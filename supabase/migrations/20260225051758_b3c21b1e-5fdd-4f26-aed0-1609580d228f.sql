
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'pcs',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth for this POS system - store staff access)
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number = 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();

-- Insert sample products
INSERT INTO public.products (name, barcode, category, price, cost_price, stock_quantity, min_stock_level, unit) VALUES
('Organic Milk 1L', '8901234567890', 'Dairy', 3.99, 2.50, 150, 20, 'pcs'),
('Whole Wheat Bread', '8901234567891', 'Bakery', 2.49, 1.20, 80, 15, 'pcs'),
('Fresh Bananas 1kg', '8901234567892', 'Fruits', 1.29, 0.70, 200, 30, 'kg'),
('Chicken Breast 500g', '8901234567893', 'Meat', 6.99, 4.50, 45, 10, 'pcs'),
('Basmati Rice 5kg', '8901234567894', 'Grains', 8.99, 5.80, 120, 25, 'pcs'),
('Olive Oil 1L', '8901234567895', 'Oils', 7.49, 4.90, 60, 10, 'pcs'),
('Cheddar Cheese 200g', '8901234567896', 'Dairy', 4.29, 2.80, 90, 15, 'pcs'),
('Orange Juice 1L', '8901234567897', 'Beverages', 3.49, 2.10, 110, 20, 'pcs'),
('Pasta Spaghetti 500g', '8901234567898', 'Grains', 1.99, 1.00, 200, 30, 'pcs'),
('Dark Chocolate 100g', '8901234567899', 'Snacks', 2.99, 1.80, 75, 15, 'pcs'),
('Tomato Ketchup 500ml', '8901234567900', 'Condiments', 2.79, 1.50, 95, 20, 'pcs'),
('Green Tea 25 bags', '8901234567901', 'Beverages', 3.29, 1.90, 130, 20, 'pcs'),
('Yogurt Plain 500g', '8901234567902', 'Dairy', 2.19, 1.20, 85, 15, 'pcs'),
('Fresh Tomatoes 1kg', '8901234567903', 'Vegetables', 1.99, 1.00, 160, 25, 'kg'),
('Mineral Water 2L', '8901234567904', 'Beverages', 0.99, 0.40, 300, 50, 'pcs');
