import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Search, FileDown, Receipt, MessageCircle, Paperclip, History } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { enrichWithPearlModel } from "@/lib/pearlModels";
import { renderReceiptPdf } from "@/lib/receiptPdf";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  product_id?: string; // present only for catalog items (used for stock decrement)
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  brand: string;
}

const OfflineReceipt = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // WhatsApp confirmation modal
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [waPreview, setWaPreview] = useState<{
    pdfUrl: string; // data: URL for inline preview
    downloadUrl: string; // blob: URL for download/open-in-new-tab
    fileName: string;
    receiptNo: string;
    messageText: string;
    blob: Blob;
    waPhone: string;
    canShareFiles: boolean;
    platform: "ios" | "android" | "desktop";
  } | null>(null);

  // Manual entry form
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [manualQty, setManualQty] = useState<number>(1);

  const { data: products = [] } = useQuery({
    queryKey: ["receipt-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, price, brand")
        .eq("is_active", true)
        .limit(20);
      if (search.trim()) {
        q = q.ilike("name", `%${search.trim()}%`);
      } else {
        q = q.order("name", { ascending: true });
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ProductRow[];
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company-settings-receipt"],
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

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.price, 0),
    [items]
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const addProduct = (p: ProductRow) => {
    const enrichedName = enrichWithPearlModel(p.name);
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `cat_${p.id}_${Date.now()}`,
          product_id: p.id,
          name: enrichedName,
          quantity: 1,
          price: Number(p.price),
        },
      ];
    });
    setSearchOpen(false);
    setSearch("");
  };

  const addManual = () => {
    if (!manualName.trim() || manualPrice <= 0 || manualQty <= 0) {
      toast.error("Enter name, price and quantity");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        name: enrichWithPearlModel(manualName.trim()),
        quantity: manualQty,
        price: manualPrice,
      },
    ]);
    setManualName("");
    setManualPrice(0);
    setManualQty(1);
  };

  const updateItem = (id: string, patch: Partial<ReceiptItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const formatCurrency = (n: number) =>
    `Rs. ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

  const buildReceiptInfo = () => {
    const receiptNo = `R-${Date.now().toString().slice(-8)}`;
    const dateStr = new Date().toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { receiptNo, dateStr };
  };

  // Track receipts already saved this session to avoid duplicate inserts
  const savedReceiptsRef = useRef<Set<string>>(new Set());

  const persistReceipt = async (receiptNo: string) => {
    if (savedReceiptsRef.current.has(receiptNo)) return;
    savedReceiptsRef.current.add(receiptNo);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const itemsPayload = items.map((it) => ({
        product_id: it.product_id || null,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      }));

      const { error: insertError } = await supabase.from("offline_receipts").insert({
        receipt_no: receiptNo,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim() || null,
        payment_method: paymentMethod || null,
        notes: notes.trim() || null,
        items: itemsPayload,
        subtotal,
        discount: Number(discount) || 0,
        total,
        created_by: userData.user?.id || null,
      });
      if (insertError) {
        console.error("Receipt save error:", insertError);
        // Allow retry on next call
        savedReceiptsRef.current.delete(receiptNo);
        return;
      }

      // Decrement stock only for catalog items
      const stockItems = items
        .filter((it) => !!it.product_id)
        .map((it) => ({
          product_id: it.product_id as string,
          quantity: it.quantity,
        }));
      if (stockItems.length > 0) {
        const { error: stockErr } = await supabase.rpc("decrement_product_stock", {
          _items: stockItems,
        });
        if (stockErr) console.error("Stock decrement error:", stockErr);
      }
    } catch (e) {
      console.error("Persist receipt exception:", e);
      savedReceiptsRef.current.delete(receiptNo);
    }
  };

  const generatePDF = (
    info?: { receiptNo: string; dateStr: string },
    options?: { skipDownload?: boolean; returnBlob?: boolean }
  ): { receiptNo: string; dateStr: string; blob?: Blob; fileName: string } | null => {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return null;
    }
    if (!customerName.trim()) {
      toast.error("Enter customer name");
      return null;
    }

    const { receiptNo, dateStr } = info || buildReceiptInfo();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    const headerName = (company?.company_name || "World Spilt Centre").trim();
    const displayName = /electronics/i.test(headerName)
      ? headerName
      : `${headerName} Electronics`;
    doc.text(displayName, 20, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(company?.address || "Model Town, Lahore", 20, 32);
    doc.text(`Phone: ${company?.phone || "0300-4649141"}`, 20, 37);
    if (company?.email) doc.text(`Email: ${company.email}`, 20, 42);

    // Receipt title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("SALES RECEIPT", pageWidth - 20, 25, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt #: ${receiptNo}`, pageWidth - 20, 33, { align: "right" });
    doc.text(`Date: ${dateStr}`, pageWidth - 20, 38, { align: "right" });
    doc.setTextColor(40, 167, 69);
    doc.setFont("helvetica", "bold");
    doc.text("Status: PAID", pageWidth - 20, 43, { align: "right" });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 55, pageWidth - 20, 55);

    // Customer
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", 20, 65);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(customerName, 20, 72);
    if (customerPhone) {
      doc.setTextColor(100, 100, 100);
      doc.text(customerPhone, 20, 78);
    }
    if (customerAddress) {
      doc.setTextColor(100, 100, 100);
      const lines = doc.splitTextToSize(customerAddress, pageWidth / 2 - 25);
      doc.text(lines, 20, 84);
    }

    // Payment method (right)
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment:", pageWidth / 2, 65);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(paymentMethod, pageWidth / 2, 72);

    // Items table
    const tableTop = 100;
    doc.setFillColor(249, 250, 251);
    doc.rect(20, tableTop - 6, pageWidth - 40, 12, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99);
    doc.text("ITEM DESCRIPTION", 25, tableTop);
    doc.text("QTY", pageWidth - 85, tableTop, { align: "center" });
    doc.text("UNIT PRICE", pageWidth - 55, tableTop, { align: "right" });
    doc.text("AMOUNT", pageWidth - 25, tableTop, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    let y = tableTop + 15;

    items.forEach((item, idx) => {
      const lineTotal = item.quantity * item.price;
      const truncated =
        item.name.length > 45 ? item.name.substring(0, 45) + "..." : item.name;
      if (idx % 2 === 1) {
        doc.setFillColor(252, 252, 252);
        doc.rect(20, y - 5, pageWidth - 40, 10, "F");
      }
      doc.setFontSize(9);
      doc.text(truncated, 25, y);
      doc.text(String(item.quantity), pageWidth - 85, y, { align: "center" });
      doc.text(formatCurrency(item.price), pageWidth - 55, y, { align: "right" });
      doc.text(formatCurrency(lineTotal), pageWidth - 25, y, { align: "right" });
      y += 10;
    });

    // Totals
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(pageWidth - 100, y, pageWidth - 20, y);
    y += 12;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", pageWidth - 65, y, { align: "right" });
    doc.setTextColor(55, 65, 81);
    doc.text(formatCurrency(subtotal), pageWidth - 25, y, { align: "right" });
    y += 8;

    if (discount > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text("Discount:", pageWidth - 65, y, { align: "right" });
      doc.text(`-${formatCurrency(discount)}`, pageWidth - 25, y, {
        align: "right",
      });
      y += 8;
    }

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth - 100, y, pageWidth - 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("TOTAL:", pageWidth - 65, y, { align: "right" });
    doc.setTextColor(220, 38, 38);
    doc.text(formatCurrency(total), pageWidth - 25, y, { align: "right" });

    // Notes
    if (notes.trim()) {
      y += 18;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(75, 85, 99);
      doc.text("Notes:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const noteLines = doc.splitTextToSize(notes.trim(), pageWidth - 40);
      doc.text(noteLines, 20, y + 6);
    }

    // Footer
    const footerY = 270;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your purchase!", pageWidth / 2, footerY, {
      align: "center",
    });
    doc.text(
      `Generated on ${new Date().toLocaleString("en-PK")}`,
      pageWidth / 2,
      footerY + 5,
      { align: "center" }
    );

    const fileName = `receipt-${receiptNo}.pdf`;
    const blob = options?.returnBlob ? doc.output("blob") : undefined;
    if (!options?.skipDownload) {
      doc.save(fileName);
      toast.success("Receipt generated");
    }
    // Save receipt + decrement stock (idempotent per receiptNo)
    persistReceipt(receiptNo);
    return { receiptNo, dateStr, blob, fileName };
  };

  const buildWhatsAppMessage = (info: { receiptNo: string; dateStr: string }) => {
    const baseName = (company?.company_name || "World Spilt Centre").trim();
    const companyName = /electronics/i.test(baseName) ? baseName : `${baseName} Electronics`;
    const lines: string[] = [];
    lines.push(`*${companyName}*`);
    lines.push(`Sales Receipt #${info.receiptNo}`);
    lines.push(`Date: ${info.dateStr}`);
    lines.push("");
    lines.push(`*Customer:* ${customerName}`);
    if (customerPhone) lines.push(`Phone: ${customerPhone}`);
    if (customerAddress) lines.push(`Address: ${customerAddress}`);
    lines.push(`Payment: ${paymentMethod}`);
    lines.push("");
    lines.push("*Items:*");
    items.forEach((it, idx) => {
      lines.push(
        `${idx + 1}. ${it.name} — ${it.quantity} x ${formatCurrency(it.price)} = ${formatCurrency(it.quantity * it.price)}`
      );
    });
    lines.push("");
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    if (discount > 0) lines.push(`Discount: -${formatCurrency(discount)}`);
    lines.push(`*Total: ${formatCurrency(total)}*`);
    if (notes.trim()) {
      lines.push("");
      lines.push(`Notes: ${notes.trim()}`);
    }
    lines.push("");
    lines.push("Thank you for your purchase!");
    if (company?.phone) lines.push(`Contact: ${company.phone}`);
    return lines.join("\n");
  };

  const normalizeWaPhone = () => {
    const raw = (customerPhone || "").replace(/[^\d]/g, "");
    if (!raw) return "";
    if (raw.startsWith("92")) return raw;
    if (raw.startsWith("0")) return "92" + raw.slice(1);
    if (raw.length === 10) return "92" + raw;
    return raw;
  };

  const detectPlatform = (): "ios" | "android" | "desktop" => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
  };

  const sendToWhatsApp = () => {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Enter customer name");
      return;
    }

    const info = buildReceiptInfo();
    const result = generatePDF(info, { skipDownload: true, returnBlob: true });
    if (!result?.blob) return;

    const messageText = buildWhatsAppMessage(info);
    const waPhone = normalizeWaPhone();
    const file = new File([result.blob], result.fileName, {
      type: "application/pdf",
    });
    const navAny = navigator as any;
    const canShareFiles = !!(
      navAny.canShare &&
      navAny.canShare({ files: [file] }) &&
      typeof navAny.share === "function"
    );

    // Build a data URL for inline preview (more reliable in iframes than blob URLs).
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setWaPreview({
        pdfUrl: dataUrl,
        downloadUrl: URL.createObjectURL(result.blob!),
        fileName: result.fileName,
        receiptNo: info.receiptNo,
        messageText,
        blob: result.blob!,
        waPhone,
        canShareFiles,
        platform: detectPlatform(),
      });
      setWaDialogOpen(true);
    };
    reader.onerror = () => {
      // Fallback to blob URL if FileReader fails
      const blobUrl = URL.createObjectURL(result.blob!);
      setWaPreview({
        pdfUrl: blobUrl,
        downloadUrl: blobUrl,
        fileName: result.fileName,
        receiptNo: info.receiptNo,
        messageText,
        blob: result.blob!,
        waPhone,
        canShareFiles,
        platform: detectPlatform(),
      });
      setWaDialogOpen(true);
    };
    reader.readAsDataURL(result.blob);
  };

  const confirmSendToWhatsApp = async () => {
    if (!waPreview) return;
    const { blob, fileName, receiptNo, messageText, waPhone, canShareFiles } =
      waPreview;

    // 1) Web Share API path (mobile / supported browsers): attaches PDF directly
    if (canShareFiles) {
      try {
        const file = new File([blob], fileName, { type: "application/pdf" });
        await (navigator as any).share({
          files: [file],
          title: `Receipt ${receiptNo}`,
          text: messageText,
        });
        // Also save a local copy
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast.success("Shared receipt — pick WhatsApp from the share sheet");
        closeWaDialog();
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // fall through to wa.me fallback
      }
    }

    // 2) Desktop fallback: download PDF + open WhatsApp Web prefilled
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    toast.success(
      `PDF "${fileName}" downloaded. In WhatsApp: click 📎 → Document → select "${fileName}" from your Downloads folder.`,
      { duration: 10000 }
    );
    closeWaDialog();
  };

  const closeWaDialog = () => {
    if (waPreview?.downloadUrl) URL.revokeObjectURL(waPreview.downloadUrl);
    setWaPreview(null);
    setWaDialogOpen(false);
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("Cash");
    setNotes("");
    setDiscount(0);
    setItems([]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7" />
              Offline Receipt
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate printable receipts for walk-in customers
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to="/admin/receipt-history">
                <History className="h-4 w-4 mr-2" />
                Receipt History
              </Link>
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={sendToWhatsApp}
              className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send to WhatsApp
            </Button>
            <Button onClick={() => generatePDF()}>
              <FileDown className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add from Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        className="pl-9"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 max-h-80 overflow-auto"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    {products.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No products found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full text-left p-3 hover:bg-muted transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {p.brand}
                              </div>
                            </div>
                            <div className="text-sm font-semibold whitespace-nowrap">
                              {formatCurrency(Number(p.price))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Manual Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <Label className="text-xs">Item name</Label>
                    <Input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Installation charges"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={manualQty}
                      onChange={(e) => setManualQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Price (Rs.)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={manualPrice}
                      onChange={(e) => setManualPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={addManual}
                      className="w-full"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No items added yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-32">Price</TableHead>
                        <TableHead className="w-32 text-right">
                          Amount
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                updateItem(item.id, { name: e.target.value })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: Math.max(
                                    1,
                                    Number(e.target.value)
                                  ),
                                })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  price: Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.quantity * item.price)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: customer + totals */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03xx-xxxxxxx"
                  />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Optional"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">Payment Method</Label>
                  <Input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Cash / Card / Bank Transfer"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div>
                  <Label className="text-xs">Discount (Rs.)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
                <div className="flex justify-between text-base font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-destructive">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for the receipt"
                    rows={3}
                  />
                </div>
                <Button onClick={() => generatePDF()} className="w-full" size="lg">
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate Receipt PDF
                </Button>
                <Button
                  onClick={sendToWhatsApp}
                  variant="outline"
                  className="w-full border-green-600 text-green-700 hover:bg-green-50 hover:text-green-700"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send to WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={waDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeWaDialog();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Send Receipt to WhatsApp
            </DialogTitle>
            <DialogDescription>
              Review the generated receipt and follow the steps below to attach it.
            </DialogDescription>
          </DialogHeader>

          {waPreview && (
            <div className="space-y-4">
              {/* File summary */}
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Paperclip className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Generated PDF
                    </div>
                    <div className="font-mono text-sm font-semibold truncate">
                      {waPreview.fileName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <a
                    href={waPreview.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open
                  </a>
                  <a
                    href={waPreview.downloadUrl}
                    download={waPreview.fileName}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>

              {/* PDF preview */}
              <div className="rounded-lg border overflow-hidden bg-muted">
                <object
                  data={waPreview.pdfUrl}
                  type="application/pdf"
                  className="w-full h-[50vh]"
                  aria-label="Receipt preview"
                >
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Your browser can't display the PDF inline.{" "}
                    <a
                      href={waPreview.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline font-medium"
                    >
                      Open the receipt in a new tab
                    </a>
                    .
                  </div>
                </object>
              </div>

              {/* Device-specific instructions */}
              <div className="rounded-lg border border-green-600/30 bg-green-50/50 p-4">
                <div className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  How to attach on{" "}
                  {waPreview.platform === "ios"
                    ? "iPhone / iPad"
                    : waPreview.platform === "android"
                    ? "Android"
                    : "Desktop"}
                </div>
                {waPreview.canShareFiles ? (
                  <ol className="text-sm text-green-900 space-y-1.5 list-decimal list-inside">
                    <li>Click <strong>Send via WhatsApp</strong> below.</li>
                    <li>
                      The system share sheet opens — choose{" "}
                      <strong>WhatsApp</strong>.
                    </li>
                    <li>
                      Select the chat (or {waPreview.waPhone ? "the customer's chat opens automatically" : "any contact"}).
                    </li>
                    <li>
                      The PDF{" "}
                      <code className="px-1 py-0.5 rounded bg-white border text-xs">
                        {waPreview.fileName}
                      </code>{" "}
                      is attached automatically — tap <strong>Send</strong>.
                    </li>
                  </ol>
                ) : (
                  <ol className="text-sm text-green-900 space-y-1.5 list-decimal list-inside">
                    <li>Click <strong>Send via WhatsApp</strong> below.</li>
                    <li>
                      The PDF{" "}
                      <code className="px-1 py-0.5 rounded bg-white border text-xs">
                        {waPreview.fileName}
                      </code>{" "}
                      will download to your <strong>Downloads</strong> folder.
                    </li>
                    <li>
                      WhatsApp Web opens with the receipt summary
                      {waPreview.waPhone ? " in the customer's chat" : ""}.
                    </li>
                    <li>
                      In WhatsApp, click the <strong>📎 attach</strong> icon →{" "}
                      <strong>Document</strong>.
                    </li>
                    <li>
                      Select{" "}
                      <code className="px-1 py-0.5 rounded bg-white border text-xs">
                        {waPreview.fileName}
                      </code>{" "}
                      from Downloads and press <strong>Send</strong>.
                    </li>
                  </ol>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={closeWaDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmSendToWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default OfflineReceipt;
