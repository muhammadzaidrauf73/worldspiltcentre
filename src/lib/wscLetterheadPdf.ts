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
    // ===== Receipt layout (image 1055x1491 → pt scale ~0.564) =====
    doc.setFontSize(11);
    // Date (left) and Ref (right) — values written on the printed dotted lines
    doc.text(String(data.date || ""), 95, 142);
    doc.text(String(data.refNo || ""), 395, 142);

    // M/S Customer Name (inline after the printed label)
    const ms = doc.splitTextToSize(data.customerName || "", 400);
    doc.text(ms.slice(0, 1), 175, 170);

    // Address (inline after the printed label)
    const addr = doc.splitTextToSize(data.customerAddress || "", 470);
    doc.text(addr.slice(0, 1), 100, 200);

    // Phone (inline after the printed label)
    doc.text(String(data.customerPhone || ""), 95, 245);

    // ----- Items table (10 rows max) -----
    // Column centers / right edges (pt)
    const COL_SR_C = 37;
    const COL_QTY_C = 80;
    const COL_DESC_X = 105;
    const COL_DESC_W = 305;
    const COL_RATE_R = 495;
    const COL_AMT_R = 572;

    const TABLE_TOP = 305;
    const ROW_H = 28;
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

    // ----- Totals box (right side) -----
    doc.setFontSize(11);
    const TOTAL_X = 568;
    doc.text(String(data.subTotal || ""), TOTAL_X, 622, { align: "right" });
    doc.text(String(data.discount || ""), TOTAL_X, 644, { align: "right" });
    doc.text(String(data.paidAmount || ""), TOTAL_X, 666, { align: "right" });
    doc.text(String(data.balance || ""), TOTAL_X, 688, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(String(data.totalAmount || ""), TOTAL_X, 712, { align: "right" });
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
