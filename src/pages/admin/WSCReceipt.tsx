import { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Download, Eye } from "lucide-react";
import { downloadWSCPdf, previewWSCPdf, WSCDocType, WSCItem } from "@/lib/wscLetterheadPdf";
import { toast } from "sonner";

const todayStr = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const emptyItem = (): WSCItem => ({ qty: "", description: "", rate: "", amount: "" });

const WSCReceipt = () => {
  const [tab, setTab] = useState<WSCDocType>("receipt");

  // Shared header
  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(todayStr());
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Receipt items
  const [items, setItems] = useState<WSCItem[]>([emptyItem()]);

  // Quotation body
  const [quotationBody, setQuotationBody] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const n = parseFloat((it.amount || "0").replace(/,/g, ""));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }, [items]);

  const updateItem = (idx: number, field: keyof WSCItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // auto-calc amount = qty * rate
      if (field === "qty" || field === "rate") {
        const q = parseFloat(next[idx].qty.replace(/,/g, ""));
        const r = parseFloat(next[idx].rate.replace(/,/g, ""));
        if (!isNaN(q) && !isNaN(r)) {
          next[idx].amount = (q * r).toFixed(0);
        }
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
    items,
    totalAmount: totalAmount ? totalAmount.toLocaleString("en-PK") : "",
    bodyText: quotationBody,
  });

  const handlePreview = async () => {
    setGenerating(true);
    try {
      const url = await previewWSCPdf(buildData());
      setPreviewUrl(url);
    } catch (e) {
      toast.error("Failed to generate preview");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadWSCPdf(buildData());
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("Failed to download");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">World Split Centre — Offline Documents</h1>
          <p className="text-muted-foreground mt-1">
            Generate official letterhead Quotations and Receipts.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as WSCDocType); setPreviewUrl(null); }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
          </TabsList>

          <Card className="p-6 mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Reference No.</Label>
                <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="e.g. WSC-1024" />
              </div>
              <div>
                <Label>Date</Label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="DD-MM-YYYY" />
              </div>
              <div className="md:col-span-2">
                <Label>M/S (Customer / Company Name)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer or company name" />
              </div>
              <div className="md:col-span-2">
                <Label>Address (optional)</Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Address line" />
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
                <Label>Items</Label>
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

              <div className="flex justify-end font-bold text-lg pt-2 border-t">
                Total: Rs. {totalAmount.toLocaleString("en-PK")}
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
      </div>
    </AdminLayout>
  );
};

export default WSCReceipt;
