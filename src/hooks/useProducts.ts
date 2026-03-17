import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name");
        if (error) {
          console.warn("Error fetching products:", error.message);
          return [];
        }
        return data as Product[];
      } catch (err) {
        console.warn("Unexpected error in useProducts:", err);
        return [];
      }
    },
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("name");
        if (error) {
          console.warn("Error fetching active products:", error.message);
          return [];
        }
        return data as Product[];
      } catch (err) {
        console.warn("Unexpected error in useActiveProducts:", err);
        return [];
      }
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: TablesInsert<"products">) => {
      try {
        const { data, error } = await supabase.from("products").insert(product).select().maybeSingle();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.warn("Failed to create product:", err.message);
        throw err;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"products"> & { id: string }) => {
      try {
        if (!id) throw new Error("Product ID is required");
        const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().maybeSingle();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.warn("Failed to update product:", err.message);
        throw err;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!id) throw new Error("Product ID is required");
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.warn("Failed to delete product:", err.message);
        throw err;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
