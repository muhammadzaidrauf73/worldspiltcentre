import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Check, Clock, Package, Truck, XCircle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  orderId: string;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: "Order Placed", color: "text-amber-500" },
  confirmed: { icon: Check, label: "Confirmed", color: "text-blue-500" },
  processing: { icon: Package, label: "Processing", color: "text-purple-500" },
  shipped: { icon: Truck, label: "Shipped", color: "text-indigo-500" },
  delivered: { icon: Check, label: "Delivered", color: "text-emerald-500" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-red-500" },
};

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const queryClient = useQueryClient();
  
  const { data: history, isLoading } = useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as StatusHistoryItem[];
    },
  });

  // Subscribe to real-time updates for this order's status history
  useEffect(() => {
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order status update received:', payload);
          // Invalidate and refetch the query when changes occur
          queryClient.invalidateQueries({ queryKey: ["order-status-history", orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  if (isLoading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        No tracking history available
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative">
        {history.map((item, index) => {
          const config = statusConfig[item.status] || { 
            icon: CircleDot, 
            label: item.status, 
            color: "text-muted-foreground" 
          };
          const Icon = config.icon;
          const isLast = index === history.length - 1;
          const isCompleted = !isLast;

          return (
            <div key={item.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    isLast 
                      ? `${config.color} border-current bg-background` 
                      : "border-emerald-500 bg-emerald-500 text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-emerald-500 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "font-medium text-sm",
                    isLast ? config.color : "text-foreground"
                  )}>
                    {config.label}
                  </p>
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </time>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
