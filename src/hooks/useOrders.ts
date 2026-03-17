import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  net_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface CreateOrderInput {
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  tax_amount: number;
  net_amount: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export function useCustomerOrders(userId?: string) {
  return useQuery({
    queryKey: ["orders", "customer", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        if (!userId) return [];
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", userId)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.warn("Error fetching customer orders:", error.message);
          return [];
        }
        return data as Order[];
      } catch (err) {
        console.warn("Unexpected error in useCustomerOrders:", err);
        return [];
      }
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.warn("Error fetching all orders:", error.message);
          return [];
        }
        return data as Order[];
      } catch (err) {
        console.warn("Unexpected error in useAllOrders:", err);
        return [];
      }
    },
  });
}

export function useOrderItems(orderId?: string) {
  return useQuery({
    queryKey: ["order_items", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      try {
        if (!orderId) return [];
        const { data, error } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);
        
        if (error) {
          console.warn("Error fetching order items:", error.message);
          return [];
        }
        return data as OrderItem[];
      } catch (err) {
        console.warn("Unexpected error in useOrderItems:", err);
        return [];
      }
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      try {
        const { items, ...orderData } = input;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({ ...orderData, customer_id: user.id })
          .select()
          .maybeSingle();
        
        if (orderError) throw orderError;
        if (!order) throw new Error("Failed to create order");

        const orderItems = items.map((item) => ({
          ...item,
          order_id: order.id,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        return order as Order;
      } catch (err: any) {
        console.warn("Order placement failed safely:", err.message);
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      try {
        if (!orderId) throw new Error("Order ID is required");
        const { data, error } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .select()
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.warn("Failed to update order status:", err.message);
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRealtimeOrders() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          qc.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
