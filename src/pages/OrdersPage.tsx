import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock, Package, Eye } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAllOrders, useOrderItems, useUpdateOrderStatus, useRealtimeOrders, type Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export default function OrdersPage() {
  useRealtimeOrders();
  const { data: orders = [] } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [prevCount, setPrevCount] = useState(0);

  // Notification sound/toast for new orders
  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    if (pendingCount > prevCount && prevCount > 0) {
      toast.info("🔔 New order received!", { duration: 5000 });
    }
    setPrevCount(pendingCount);
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success(`Order ${status}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Orders</h1>
            <p className="text-muted-foreground text-sm">Real-time order notifications from customers</p>
          </div>
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-full">
              <Bell className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-semibold">{pendingOrders.length} new orders</span>
            </div>
          )}
        </div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-warning flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" /> Pending Orders ({pendingOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => setSelectedOrder(order.id)}
                  onConfirm={() => handleStatusUpdate(order.id, "confirmed")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Orders */}
        {confirmedOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-info flex items-center gap-2 mb-3">
              <Package className="h-4 w-4" /> Confirmed ({confirmedOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {confirmedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => setSelectedOrder(order.id)}
                  onComplete={() => handleStatusUpdate(order.id, "completed")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-success flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4" /> Completed ({completedOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {completedOrders.slice(0, 6).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => setSelectedOrder(order.id)}
                />
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No orders yet. Waiting for customer orders...</p>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <OrderDetailModal
            orderId={selectedOrder}
            order={orders.find((o) => o.id === selectedOrder)!}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}

function OrderCard({
  order,
  onView,
  onConfirm,
  onComplete,
}: {
  order: Order;
  onView: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm">{order.customer_name}</p>
          {order.customer_phone && (
            <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
          )}
        </div>
        <p className="text-lg font-bold text-primary">₹{Number(order.net_amount).toFixed(2)}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
        {onConfirm && (
          <Button size="sm" onClick={onConfirm} className="flex-1">
            Confirm
          </Button>
        )}
        {onComplete && (
          <Button size="sm" variant="secondary" onClick={onComplete} className="flex-1 bg-success/10 text-success hover:bg-success/20">
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}

function OrderDetailModal({
  orderId,
  order,
  onClose,
}: {
  orderId: string;
  order: Order;
  onClose: () => void;
}) {
  const { data: items = [] } = useOrderItems(orderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Order Details</h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), "MMMM d, yyyy • h:mm a")}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
          <p className="text-sm font-medium">{order.customer_name}</p>
          {order.customer_phone && (
            <p className="text-xs text-muted-foreground">📞 {order.customer_phone}</p>
          )}
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
            order.status === "pending" ? "bg-warning/10 text-warning" :
            order.status === "confirmed" ? "bg-info/10 text-info" :
            "bg-success/10 text-success"
          }`}>
            {order.status}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Items</h3>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">₹{Number(item.unit_price).toFixed(2)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">₹{Number(item.total_price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-sm border-t pt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{Number(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST (18%)</span>
            <span>₹{Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₹{Number(order.net_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
