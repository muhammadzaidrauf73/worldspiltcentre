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
 * Renders the receipt as a jsPDF document. Pure function — caller decides whether to save/blob.
 */
export const renderReceiptPdf = (data: ReceiptPdfData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 51, 51);
  doc.text(data.companyName || "World Spilt Centre", 20, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(data.companyAddress || "Model Town, Lahore", 20, 32);
  doc.text(`Phone: ${data.companyPhone || "0300-4649141"}`, 20, 37);
  if (data.companyEmail) doc.text(`Email: ${data.companyEmail}`, 20, 42);

  // Receipt title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 51, 51);
  doc.text("SALES RECEIPT", pageWidth - 20, 25, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Receipt #: ${data.receiptNo}`, pageWidth - 20, 33, { align: "right" });
  doc.text(`Date: ${data.dateStr}`, pageWidth - 20, 38, { align: "right" });
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
  doc.text(data.customerName, 20, 72);
  if (data.customerPhone) {
    doc.setTextColor(100, 100, 100);
    doc.text(data.customerPhone, 20, 78);
  }
  if (data.customerAddress) {
    doc.setTextColor(100, 100, 100);
    const lines = doc.splitTextToSize(data.customerAddress, pageWidth / 2 - 25);
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
  doc.text(data.paymentMethod || "Cash", pageWidth / 2, 72);

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

  data.items.forEach((item, idx) => {
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
  doc.text(formatCurrency(data.subtotal), pageWidth - 25, y, { align: "right" });
  y += 8;

  if (data.discount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Discount:", pageWidth - 65, y, { align: "right" });
    doc.text(`-${formatCurrency(data.discount)}`, pageWidth - 25, y, {
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
  doc.text(formatCurrency(data.total), pageWidth - 25, y, { align: "right" });

  // Notes
  if (data.notes && data.notes.trim()) {
    y += 18;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99);
    doc.text("Notes:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(data.notes.trim(), pageWidth - 40);
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

  return doc;
};
