import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, FileDown, Search, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { renderReceiptPdf } from "@/lib/receiptPdf";

interface OfflineReceiptRow {
  id: string;
  receipt_no: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  payment_method: string | null;
  notes: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    product_id?: string | null;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
}

const formatCurrency = (n: number) =>
  `Rs. ${Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const formatDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const ReceiptHistory = () => {
  const [search, setSearch] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<OfflineReceiptRow | null>(null);

  const { data: company } = useQuery({
    queryKey: ["company-settings-receipt-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("key, value")
        .in("key", ["company_name", "phone", "email", "address"]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        map[r.key] = r.value;
      });
      return map;
    },
  });

  const { data: receipts = [], isLoading, refetch } = useQuery({
    queryKey: ["offline-receipts", search],
    queryFn: async () => {
      let q = supabase
        .from("offline_receipts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(
          `receipt_no.ilike.${term},customer_name.ilike.${term},customer_phone.ilike.${term}`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as OfflineReceiptRow[];
    },
  });

  const downloadPdf = (r: OfflineReceiptRow) => {
    try {
      const doc = renderReceiptPdf({
        receiptNo: r.receipt_no,
        dateStr: formatDateLong(r.created_at),
        companyName: company?.company_name,
        companyAddress: company?.address,
        companyPhone: company?.phone,
        companyEmail: company?.email,
        customerName: r.customer_name,
        customerPhone: r.customer_phone || undefined,
        customerAddress: r.customer_address || undefined,
        paymentMethod: r.payment_method || "Cash",
        items: (r.items || []).map((it) => ({
          name: it.name,
          quantity: Number(it.quantity) || 0,
          price: Number(it.price) || 0,
        })),
        subtotal: Number(r.subtotal) || 0,
        discount: Number(r.discount) || 0,
        total: Number(r.total) || 0,
        notes: r.notes || undefined,
      });
      doc.save(`World Split Centre Electronics - REC #${r.receipt_no}.pdf`);
      toast.success(`Downloaded receipt ${r.receipt_no}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-7 w-7" />
              Receipt History
            </h1>
            <p className="text-muted-foreground mt-1">
              Re-download or review previously generated offline receipts
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/offline-receipt">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Receipt Generator
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Receipts ({receipts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt #, customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading receipts...
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No receipts found yet. Generate one from the Offline Receipt page.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {r.receipt_no}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.customer_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.customer_phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(r.items || []).length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(r.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewReceipt(r)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPdf(r)}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!previewReceipt}
        onOpenChange={(open) => !open && setPreviewReceipt(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">
              Receipt {previewReceipt?.receipt_no}
            </DialogTitle>
          </DialogHeader>
          {previewReceipt && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{previewReceipt.customer_name}</div>
                  {previewReceipt.customer_phone && (
                    <div className="text-muted-foreground text-xs">
                      {previewReceipt.customer_phone}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div>{formatDateLong(previewReceipt.created_at)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Payment: {previewReceipt.payment_method || "Cash"}
                  </div>
                </div>
              </div>

              {previewReceipt.customer_address && (
                <div>
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div>{previewReceipt.customer_address}</div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-16 text-center">Qty</TableHead>
                      <TableHead className="w-24 text-right">Price</TableHead>
                      <TableHead className="w-24 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewReceipt.items || []).map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{it.name}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(it.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(it.quantity * it.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-sm">
                  <span className="text-muted-foreground">Subtotal: </span>
                  {formatCurrency(previewReceipt.subtotal)}
                </div>
                {previewReceipt.discount > 0 && (
                  <div className="text-sm text-green-600">
                    Discount: -{formatCurrency(previewReceipt.discount)}
                  </div>
                )}
                <div className="text-lg font-bold">
                  Total: {formatCurrency(previewReceipt.total)}
                </div>
              </div>

              {previewReceipt.notes && (
                <div className="rounded border bg-muted/30 p-3 text-xs">
                  <div className="font-semibold mb-1">Notes</div>
                  <div className="whitespace-pre-wrap">{previewReceipt.notes}</div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => downloadPdf(previewReceipt)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReceiptHistory;
