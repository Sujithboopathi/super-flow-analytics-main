import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useAllSaleItems() {
  return useQuery({
    queryKey: ["all_sale_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SaleItem[];
    },
  });
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateSaleInput {
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  items: CartItem[];
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { items, ...saleData } = input;
      
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({ ...saleData, invoice_number: "" })
        .select()
        .single();
      if (saleError) throw saleError;

      const saleItems = items.map((item) => ({
        ...item,
        sale_id: sale.id,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      // Deduct stock for each item
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();
        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq("id", item.product_id);
        }
      }

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
