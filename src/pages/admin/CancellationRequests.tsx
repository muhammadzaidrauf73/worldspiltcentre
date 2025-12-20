import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Eye, Loader2, XCircle } from "lucide-react";

interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  orders: {
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    total: number;
    status: string;
    created_at: string;
  } | null;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminCancellationRequests = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-cancellation-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_cancellation_requests")
        .select(`
          *,
          orders (
            id,
            customer_name,
            customer_email,
            total,
            status,
            created_at
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CancellationRequest[];
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
      orderId,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      notes: string;
      orderId: string;
    }) => {
      // Update the cancellation request
      const { error: requestError } = await supabase
        .from("order_cancellation_requests")
        .update({
          status,
          admin_notes: notes || null,
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // If approved, also cancel the order
      if (status === "approved") {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId);

        if (orderError) throw orderError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cancellation-requests"] });
      toast.success(
        variables.status === "approved"
          ? "Order cancelled successfully"
          : "Cancellation request rejected"
      );
      setSelectedRequest(null);
      setAdminNotes("");
      setActionType(null);
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const handleAction = (request: CancellationRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
  };

  const submitAction = () => {
    if (!selectedRequest || !actionType) return;
    updateRequestMutation.mutate({
      requestId: selectedRequest.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes: adminNotes,
      orderId: selectedRequest.order_id,
    });
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cancellation Requests</h1>
            <p className="text-muted-foreground">
              Review and manage order cancellation requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cancellation requests yet</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Total</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.order_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.orders?.customer_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.orders?.customer_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rs.{Number(request.orders?.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[request.status]}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600/50 hover:bg-green-600/10"
                            onClick={() => handleAction(request, "approve")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600/50 hover:bg-red-600/10"
                            onClick={() => handleAction(request, "reject")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {request.admin_notes || "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Cancellation" : "Reject Cancellation"}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Order ID: </span>
                  <span className="font-mono">{selectedRequest.order_id.slice(0, 8)}...</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  {selectedRequest.orders?.customer_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Reason: </span>
                  {selectedRequest.reason}
                </p>
              </div>

              {actionType === "approve" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-700">
                  <p className="font-medium">Warning</p>
                  <p>Approving this request will cancel the order. This action cannot be undone.</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Notes for customer (optional)
                </label>
                <Textarea
                  placeholder={
                    actionType === "approve"
                      ? "E.g., Your order has been cancelled and refund will be processed..."
                      : "E.g., Order has already been shipped and cannot be cancelled..."
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              disabled={updateRequestMutation.isPending}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {updateRequestMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionType === "approve" ? "Approve & Cancel Order" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCancellationRequests;
