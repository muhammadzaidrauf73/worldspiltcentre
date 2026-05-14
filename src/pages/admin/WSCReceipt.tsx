import { useEffect, useMemo, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Download, Eye, RefreshCw, History as HistoryIcon } from "lucide-react";
import { downloadWSCPdf, previewWSCPdf, WSCDocType, WSCItem } from "@/lib/wscLetterheadPdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const todayStr = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const emptyItem = (): WSCItem => ({ qty: "", description: "", rate: "", amount: "" });

const fmt = (n: number) => (n ? n.toLocaleString("en-PK") : "");
const num = (s: string) => {
  const n = parseFloat((s || "0").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

interface HistoryRow {
  id: string;
  doc_type: WSCDocType;
  ref_no: string;
  doc_date: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_phone: string | null;
  body_text: string | null;
  items: WSCItem[];
  sub_total: number;
  discount: number;
  paid_amount: number;
  balance: number;
  total_amount: number;
  created_at: string;
}

const WSCReceipt = () => {
  const [tab, setTab] = useState<WSCDocType>("receipt");

  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(todayStr());
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [items, setItems] = useState<WSCItem[]>([emptyItem()]);
  const [quotationBody, setQuotationBody] = useState("");

  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingRef, setLoadingRef] = useState(false);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const subTotal = useMemo(
    () => items.reduce((s, it) => s + num(it.amount), 0),
    [items]
  );
  const totalAmount = useMemo(
    () => Math.max(0, subTotal - num(discount)),
    [subTotal, discount]
  );
  const balance = useMemo(
    () => totalAmount - num(paidAmount),
    [totalAmount, paidAmount]
  );

  const fetchNextRef = useCallback(async () => {
    setLoadingRef(true);
    try {
      const { data, error } = await supabase.rpc("next_wsc_document_number" as any);
      if (error) throw error;
      setRefNo(String(data));
    } catch {
      // silent
    } finally {
      setLoadingRef(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from("wsc_documents" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setHistory(data as any);
  }, []);

  useEffect(() => {
    fetchNextRef();
    loadHistory();
  }, [fetchNextRef, loadHistory]);

  const updateItem = (idx: number, field: keyof WSCItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "qty" || field === "rate") {
        const q = num(next[idx].qty);
        const r = num(next[idx].rate);
        if (q && r) next[idx].amount = (q * r).toFixed(0);
      }
      return next;
    });
  };

  const buildData = () => ({
    docType: tab,
    refNo,
    date,
    customerName,
    customerAddress,
    customerPhone,
    items,
    subTotal: fmt(subTotal),
    discount: discount ? fmt(num(discount)) : "",
    paidAmount: paidAmount ? fmt(num(paidAmount)) : "",
    balance: fmt(balance),
    totalAmount: fmt(totalAmount),
    bodyText: quotationBody,
  });

  const saveToHistory = async () => {
    try {
      await supabase.from("wsc_documents" as any).insert({
        doc_type: tab,
        ref_no: refNo,
        doc_date: date,
        customer_name: customerName,
        customer_address: customerAddress || null,
        customer_phone: customerPhone || null,
        body_text: tab === "quotation" ? quotationBody : null,
        items: tab === "receipt" ? (items as any) : [],
        sub_total: subTotal,
        discount: num(discount),
        paid_amount: num(paidAmount),
        balance,
        total_amount: totalAmount,
      });
      loadHistory();
    } catch {
      // silent
    }
  };

  const handlePreview = async () => {
    setGenerating(true);
    try {
      setPreviewUrl(await previewWSCPdf(buildData()));
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadWSCPdf(buildData());
      await saveToHistory();
      toast.success("PDF downloaded & saved to history");
    } catch {
      toast.error("Failed to download");
    } finally {
      setGenerating(false);
    }
  };

  const handleNewDocument = async () => {
    setCustomerName("");
    setCustomerAddress("");
    setCustomerPhone("");
    setItems([emptyItem()]);
    setQuotationBody("");
    setDiscount("");
    setPaidAmount("");
    setDate(todayStr());
    setPreviewUrl(null);
    await fetchNextRef();
  };

  const downloadFromHistory = async (row: HistoryRow) => {
    const its = Array.isArray(row.items) ? row.items : [];
    await downloadWSCPdf({
      docType: row.doc_type,
      refNo: row.ref_no,
      date: row.doc_date || "",
      customerName: row.customer_name,
      customerAddress: row.customer_address || "",
      customerPhone: row.customer_phone || "",
      items: its,
      subTotal: fmt(Number(row.sub_total || 0)),
      discount: row.discount ? fmt(Number(row.discount)) : "",
      paidAmount: row.paid_amount ? fmt(Number(row.paid_amount)) : "",
      balance: fmt(Number(row.balance || 0)),
      totalAmount: fmt(Number(row.total_amount || 0)),
      bodyText: row.body_text || "",
    });
  };

  const deleteFromHistory = async (id: string) => {
    if (!confirm("Delete this document from history?")) return;
    await supabase.from("wsc_documents" as any).delete().eq("id", id);
    loadHistory();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">World Split Centre — Offline Documents</h1>
            <p className="text-muted-foreground mt-1">
              Generate official letterhead Quotations and Receipts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNewDocument}>
              <RefreshCw className="h-4 w-4 mr-2" /> New Document
            </Button>
            <Button variant={showHistory ? "default" : "outline"} onClick={() => setShowHistory((v) => !v)}>
              <HistoryIcon className="h-4 w-4 mr-2" /> History ({history.length})
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as WSCDocType); setPreviewUrl(null); }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
          </TabsList>

          <Card className="p-6 mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="DD-MM-YYYY" />
              </div>
              <div>
                <Label>Reference No. (auto)</Label>
                <div className="flex gap-2">
                  <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="100" />
                  <Button type="button" variant="outline" size="icon" onClick={fetchNextRef} disabled={loadingRef} title="Get next number">
                    <RefreshCw className={`h-4 w-4 ${loadingRef ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>M/S (Customer / Company Name)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer or company name" />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Address line" />
              </div>
              <div className="md:col-span-2">
                <Label>Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" />
              </div>
            </div>

            <TabsContent value="quotation" className="mt-4 space-y-2">
              <Label>Quotation Body</Label>
              <Textarea
                rows={14}
                value={quotationBody}
                onChange={(e) => setQuotationBody(e.target.value)}
                placeholder="Type the full quotation content here. It will be printed under the letterhead."
              />
            </TabsContent>

            <TabsContent value="receipt" className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <Label>Items (max 10 rows)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, emptyItem()])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <Input className="col-span-1" value={it.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} placeholder="1" />
                    <Input className="col-span-6" value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Item description" />
                    <Input className="col-span-2" value={it.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} placeholder="0" />
                    <Input className="col-span-2" value={it.amount} onChange={(e) => updateItem(idx, "amount", e.target.value)} placeholder="0" />
                    <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <Label>Discount</Label>
                  <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Paid Amount</Label>
                  <Input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Sub Total</span><span>Rs. {fmt(subTotal)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>Rs. {fmt(num(discount))}</span></div>
                <div className="flex justify-between"><span>Paid Amount</span><span>Rs. {fmt(num(paidAmount))}</span></div>
                <div className="flex justify-between"><span>Balance</span><span>Rs. {fmt(balance)}</span></div>
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total Amount</span><span>Rs. {fmt(totalAmount)}</span></div>
              </div>
            </TabsContent>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handlePreview} disabled={generating}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button type="button" onClick={handleDownload} disabled={generating}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </Card>
        </Tabs>

        {previewUrl && (
          <Card className="p-2">
            <div className="flex items-center justify-between p-2">
              <h3 className="font-semibold">Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>Close</Button>
            </div>
            <iframe src={previewUrl} className="w-full h-[800px] border rounded" title="Preview" />
          </Card>
        )}

        {showHistory && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Document History</h3>
              <Button variant="ghost" size="sm" onClick={loadHistory}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents saved yet. Download a document to add it here.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-2">Type</th>
                      <th className="p-2">Ref #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Customer</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2">Created</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="p-2 capitalize">{row.doc_type}</td>
                        <td className="p-2 font-medium">{row.ref_no}</td>
                        <td className="p-2">{row.doc_date}</td>
                        <td className="p-2">{row.customer_name}</td>
                        <td className="p-2 text-right">Rs. {Number(row.total_amount).toLocaleString("en-PK")}</td>
                        <td className="p-2 text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</td>
                        <td className="p-2 text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => downloadFromHistory(row)}>
                            <Download className="h-3 w-3 mr-1" /> PDF
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteFromHistory(row.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default WSCReceipt;
