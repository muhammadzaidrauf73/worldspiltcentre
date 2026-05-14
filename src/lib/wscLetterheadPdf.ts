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
  customerPhone?: string;
  items?: WSCItem[];
  subTotal?: string;
  discount?: string;
  paidAmount?: string;
  balance?: string;
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

  if (data.docType === "receipt") {
    // ===== Receipt layout (image 1054x1492 → pt scale x≈0.5648 y≈0.5643) =====
    doc.setFontSize(11);
    // Date (left) — value on the dotted line
    doc.text(String(data.date || ""), 80, 145);
    // Ref (right) — value on the dotted line
    doc.text(String(data.refNo || ""), 342, 145);

    // M/S Customer Name (inline after the printed label)
    const ms = doc.splitTextToSize(data.customerName || "", 420);
    doc.text(ms.slice(0, 1), 136, 178);

    // Address (inline after the printed label)
    const addr = doc.splitTextToSize(data.customerAddress || "", 470);
    doc.text(addr.slice(0, 1), 90, 212);

    // Phone (inline after the printed label)
    doc.text(String(data.customerPhone || ""), 90, 263);

    // ----- Items table (10 rows max) -----
    const COL_SR_C = 36;
    const COL_QTY_C = 78;
    const COL_DESC_X = 102;
    const COL_DESC_W = 300;
    const COL_RATE_R = 480;
    const COL_AMT_R = 565;

    const TABLE_TOP = 333;
    const ROW_H = 36;
    const MAX_ROWS = 10;

    const items = (data.items || []).slice(0, MAX_ROWS);
    doc.setFontSize(10);
    items.forEach((it, idx) => {
      const y = TABLE_TOP + idx * ROW_H;
      doc.text(String(idx + 1), COL_SR_C, y, { align: "center" });
      doc.text(String(it.qty || ""), COL_QTY_C, y, { align: "center" });
      const desc = doc.splitTextToSize(it.description || "", COL_DESC_W);
      doc.text(desc.slice(0, 1), COL_DESC_X, y);
      doc.text(String(it.rate || ""), COL_RATE_R, y, { align: "right" });
      doc.text(String(it.amount || ""), COL_AMT_R, y, { align: "right" });
    });

    // ----- Totals box (right side) — right edge aligned to Amount column -----
    doc.setFontSize(11);
    const TOTAL_X = 562;
    doc.text(String(data.subTotal || ""), TOTAL_X, 651, { align: "right" });
    doc.text(String(data.discount || ""), TOTAL_X, 678, { align: "right" });
    doc.text(String(data.paidAmount || ""), TOTAL_X, 703, { align: "right" });
    doc.text(String(data.balance || ""), TOTAL_X, 729, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(String(data.totalAmount || ""), TOTAL_X, 755, { align: "right" });
  } else {
    // ===== Quotation =====
    doc.setFontSize(11);
    doc.text(String(data.refNo || ""), 70, 235);
    doc.text(String(data.date || ""), 500, 235);

    const startY = 285;
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
