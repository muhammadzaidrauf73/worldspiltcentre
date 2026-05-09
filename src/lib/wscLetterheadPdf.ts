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
  date: string; // formatted
  customerName: string; // M/S line
  customerAddress?: string;
  // Receipt only:
  items?: WSCItem[];
  totalAmount?: string;
  // Quotation only:
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
  // Draw letterhead background full page
  doc.addImage(img, "JPEG", 0, 0, W, H, undefined, "FAST");

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  // Ref + Date row (around y=80pt based on image)
  doc.setFontSize(11);
  doc.text(data.refNo || "", 60, 82);
  doc.text(data.date || "", 480, 82);

  if (data.docType === "receipt") {
    // M/S line
    doc.setFontSize(11);
    const ms = data.customerName || "";
    const msLines = doc.splitTextToSize(ms, 470);
    doc.text(msLines.slice(0, 1), 55, 102);
    if (data.customerAddress) {
      const addrLines = doc.splitTextToSize(data.customerAddress, 520);
      doc.text(addrLines.slice(0, 1), 35, 122);
    }

    // Table area (matches printed grid roughly)
    // Columns: Sr# 32-78, Qty 78-130, Description 130-420, Rate 420-500, Amount 500-575
    const rowTop = 152;
    const rowH = 22;
    const items = data.items || [];
    doc.setFontSize(10);
    items.forEach((it, idx) => {
      const y = rowTop + idx * rowH;
      if (y > 670) return; // stop before O&E line
      doc.text(String(idx + 1), 50, y, { align: "center" });
      doc.text(it.qty || "", 104, y, { align: "center" });
      const descLines = doc.splitTextToSize(it.description || "", 280);
      doc.text(descLines.slice(0, 1), 135, y);
      doc.text(it.rate || "", 495, y, { align: "right" });
      doc.text(it.amount || "", 570, y, { align: "right" });
    });

    // Total amount (row above bottom border, near "Total Amount" label at ~y=695)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(data.totalAmount || "", 570, 698, { align: "right" });
  } else {
    // Quotation - free body text area below ref/date
    doc.setFontSize(11);
    const startY = 120;
    const body = data.bodyText || "";
    const lines = doc.splitTextToSize(body, W - 80);
    doc.text(lines, 40, startY);
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
