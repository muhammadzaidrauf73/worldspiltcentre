import { jsPDF } from "jspdf";

export interface ReceiptPdfItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptPdfData {
  receiptNo: string;
  dateStr: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
  items: ReceiptPdfItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}

const formatCurrency = (n: number) =>
  `Rs. ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

/**
 * Renders the receipt as a jsPDF document, styled to match the
 * "World Split Centre Electronics — INVOICE" reference layout:
 *  - Huge bold company name across the top-left
 *  - Address / phone / email stacked under it (muted)
 *  - Right column with "Rec # NNN", "Date: ...", green "Status: PAID"
 *  - Centered "INVOICE" title under the header, divider beneath
 *  - Customer (left) + Payment (right) blocks
 *  - Light-grey header row table for items
 *  - Right-aligned totals with red TOTAL
 */
export const renderReceiptPdf = (data: ReceiptPdfData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 20;
  const rightX = pageWidth - 20;

  // ===== HEADER: Big company name (left) =====
  const headerName = (data.companyName || "World Split Centre").trim();
  const displayName = /electronics/i.test(headerName)
    ? headerName
    : `${headerName} Electronics`;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(28);
  doc.text(displayName, leftX, 28);

  // Address / phone / email under company name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(data.companyAddress || "Model Town, Lahore", leftX, 38);
  doc.text(`Phone: ${data.companyPhone || "0300-4649141"}`, leftX, 44);
  if (data.companyEmail) doc.text(`Email: ${data.companyEmail}`, leftX, 50);

  // ===== HEADER: Right column (Rec #, Date, Status) =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Rec # ${data.receiptNo}`, rightX, 38, { align: "right" });
  doc.text(`Date: ${data.dateStr}`, rightX, 44, { align: "right" });

  doc.setTextColor(34, 139, 58); // green
  doc.text("Status: PAID", rightX, 50, { align: "right" });

  // ===== INVOICE title centered + divider =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(60, 60, 60);
  doc.text("INVOICE", pageWidth / 2, 68, { align: "center" });

  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.4);
  doc.line(leftX, 74, rightX, 74);

  // ===== Customer + Payment blocks =====
  const blockTop = 92;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Customer:", leftX, blockTop);
  doc.text("Payment:", pageWidth / 2, blockTop);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(data.customerName, leftX, blockTop + 8);

  if (data.customerAddress) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(data.customerAddress, pageWidth / 2 - 25);
    doc.text(lines, leftX, blockTop + 15);
  }
  if (data.customerPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(data.customerPhone, leftX, blockTop + 26);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(data.paymentMethod || "Cash", pageWidth / 2, blockTop + 8);

  // ===== Items table =====
  const tableTop = 138;
  doc.setFillColor(247, 248, 250);
  doc.rect(leftX, tableTop - 7, pageWidth - 40, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 95, 105);
  doc.text("ITEM DESCRIPTION", leftX + 5, tableTop);
  doc.text("QTY", pageWidth - 90, tableTop, { align: "center" });
  doc.text("UNIT PRICE", pageWidth - 55, tableTop, { align: "right" });
  doc.text("AMOUNT", rightX, tableTop, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  let y = tableTop + 14;

  data.items.forEach((item) => {
    const lineTotal = item.quantity * item.price;
    const nameLines = doc.splitTextToSize(item.name, pageWidth - 120);
    doc.setFontSize(10);
    doc.text(nameLines, leftX + 5, y);
    doc.text(String(item.quantity), pageWidth - 90, y, { align: "center" });
    doc.text(formatCurrency(item.price), pageWidth - 55, y, { align: "right" });
    doc.text(formatCurrency(lineTotal), rightX, y, { align: "right" });
    y += Math.max(10, nameLines.length * 6);
  });

  // ===== Totals =====
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(pageWidth - 110, y, rightX, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal :", pageWidth - 60, y, { align: "right" });
  doc.setTextColor(40, 40, 40);
  doc.text(formatCurrency(data.subtotal), rightX, y, { align: "right" });
  y += 8;

  if (data.discount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Discount :", pageWidth - 60, y, { align: "right" });
    doc.text(`-${formatCurrency(data.discount)}`, rightX, y, { align: "right" });
    y += 8;
  }

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(pageWidth - 110, y, rightX, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text("TOTAL:", pageWidth - 60, y, { align: "right" });
  doc.setTextColor(220, 38, 38);
  doc.text(formatCurrency(data.total), rightX, y, { align: "right" });

  // ===== Notes =====
  if (data.notes && data.notes.trim()) {
    y += 18;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99);
    doc.text("Notes:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    const noteLines = doc.splitTextToSize(data.notes.trim(), pageWidth - 40);
    doc.text(noteLines, leftX, y + 6);
  }

  // ===== Footer =====
  const footerY = 280;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your purchase!", pageWidth / 2, footerY, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.text(
    `Generated on ${new Date().toLocaleString("en-PK")}`,
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  return doc;
};
