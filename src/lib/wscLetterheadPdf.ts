import jsPDF from "jspdf";
import quotationLetterhead from "@/assets/wsc-letterhead-quotation.jpg";
import receiptLetterhead from "@/assets/wsc-letterhead-receipt.jpg";

export type WSCDocType = "quotation" | "receipt";

export interface WSCItem {
  qty: string;
  description: string;
  rate: string;
  amount: string;
}

export interface WSCDocData {
  docType: WSCDocType;
  refNo: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  items?: WSCItem[];
  totalAmount?: string;
  bodyText?: string;
}

const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function generateWSCPdf(data: WSCDocData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // 595.28
  const H = doc.internal.pageSize.getHeight();  // 841.89

  const bgSrc = data.docType === "quotation" ? quotationLetterhead : receiptLetterhead;
  const img = await loadImg(bgSrc);
  doc.addImage(img, "JPEG", 0, 0, W, H, undefined, "FAST");

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  // --- Ref + Date (over the printed "Ref:" / "Date:" labels) ---
  doc.setFontSize(11);
  // Ref value goes right of "Ref:" label
  doc.text(String(data.refNo || ""), 70, 235);
  // Date value goes right of "Date:" label
  doc.text(String(data.date || ""), 500, 235);

  if (data.docType === "receipt") {
    // --- M/S customer name on first dotted line, address on second ---
    doc.setFontSize(11);
    const ms = doc.splitTextToSize(data.customerName || "", 470);
    doc.text(ms.slice(0, 1), 75, 263);
    if (data.customerAddress) {
      const addr = doc.splitTextToSize(data.customerAddress, 520);
      doc.text(addr.slice(0, 1), 40, 293);
    }

    // --- Table area (must stay INSIDE the printed grid) ---
    // Column x ranges (pt): Sr# 22-50 | Qty 50-97 | Desc 97-474 | Rate 474-534 | Amount 534-582
    const TABLE_TOP = 355;        // first row baseline (just below header divider)
    const ROW_H = 20;
    const TABLE_BOTTOM = 730;     // do not draw rows past this Y

    const items = data.items || [];
    doc.setFontSize(10);
    items.forEach((it, idx) => {
      const y = TABLE_TOP + idx * ROW_H;
      if (y > TABLE_BOTTOM) return;
      // Sr# centered in narrow column
      doc.text(String(idx + 1), 36, y, { align: "center" });
      // Qty centered
      doc.text(String(it.qty || ""), 73, y, { align: "center" });
      // Description left-aligned with wrapping (1 line per row)
      const desc = doc.splitTextToSize(it.description || "", 370);
      doc.text(desc.slice(0, 1), 105, y);
      // Rate right-aligned to right edge of Rate column
      doc.text(String(it.rate || ""), 530, y, { align: "right" });
      // Amount right-aligned to right edge of Amount column
      doc.text(String(it.amount || ""), 578, y, { align: "right" });
    });

    // --- Total amount on the bottom "Total Amount" row ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(data.totalAmount || ""), 578, 755, { align: "right" });
  } else {
    // --- Quotation: free body text below the Ref/Date row ---
    doc.setFontSize(11);
    const startY = 285;
    // M/S line if provided
    if (data.customerName) {
      doc.setFont("helvetica", "bold");
      doc.text(`M/S: ${data.customerName}`, 40, startY);
      doc.setFont("helvetica", "normal");
    }
    const body = data.bodyText || "";
    const lines = doc.splitTextToSize(body, W - 80);
    doc.text(lines, 40, startY + (data.customerName ? 22 : 0));
  }

  return doc;
}

export async function downloadWSCPdf(data: WSCDocData) {
  const doc = await generateWSCPdf(data);
  const label = data.docType === "quotation" ? "QUOTATION" : "RECEIPT";
  const fileName = `World Split Centre - ${label} ${data.refNo || ""}.pdf`.trim();
  doc.save(fileName);
}

export async function previewWSCPdf(data: WSCDocData): Promise<string> {
  const doc = await generateWSCPdf(data);
  return doc.output("datauristring");
}
