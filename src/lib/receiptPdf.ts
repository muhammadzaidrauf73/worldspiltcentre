import { jsPDF } from "jspdf";

export interface ReceiptPdfItem {
  name: string;
  quantity: number;
  price: number;
}

export type ReceiptType = "sale" | "return_customer" | "return_company";

export interface ReceiptPdfItem {
  name: string;
  quantity: number;
  price: number;
  partNo?: string;
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
  receiptType?: ReceiptType;
  // For sales returns:
  partyName?: string;        // Company / Customer the return is to/from
  partyAddress?: string;
  partyContactPerson?: string;
  partyContactNo?: string;
}

// Convert a number to English words (used for "Amount in Words" on returns).
const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? "-" + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  };
  return inWords(Math.floor(num));
};

/**
 * Renders a Sales Return PDF matching the World Split Centre printed
 * "SALES RETURN" form: bordered customer/shipping block, return invoice
 * box, items table with Description / Part No / Qty / Rate / Total Value,
 * amount in words, and Prepared By / Approved By signature lines.
 */
export const renderSalesReturnPdf = (data: ReceiptPdfData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 15;
  const rightX = pageWidth - 15;
  const contentW = rightX - leftX;

  const headerName = (data.companyName || "World Split Centre").trim();
  const displayName = /electronics/i.test(headerName) ? headerName : `${headerName} Electronics`;

  // === Top header (centered) ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(displayName.toUpperCase(), pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    (data.companyAddress || "Saleem Complex Shop # 30 Q Block Model Town Lahore").toUpperCase(),
    pageWidth / 2,
    25,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Phone : ${data.companyPhone || "+92 3225485501"}`, pageWidth / 2, 31, { align: "center" });
  doc.text(`E-mail: ${data.companyEmail || "support@worldspiltcentre.com"}`, pageWidth / 2, 38, { align: "center" });

  // === Title ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SALES RETURN", pageWidth / 2, 50, { align: "center" });

  // === Customer / Shipping bordered box ===
  const boxTop = 56;
  const boxH = 48;
  const colW = contentW / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(leftX, boxTop, contentW, boxH);
  doc.line(leftX + colW, boxTop, leftX + colW, boxTop + boxH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Company Name", leftX + 2, boxTop + 6);
  doc.text("Address", leftX + 2, boxTop + 18);
  doc.text("Shipping Address", leftX + colW + 2, boxTop + 6);
  doc.text("Contact Person :", leftX + colW + 2, boxTop + 28);
  doc.text("Contact No :", leftX + colW + 2, boxTop + 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const partyName = (data.partyName || data.customerName || "").toUpperCase();
  doc.text(partyName, leftX + 30, boxTop + 6);

  const addrLines = doc.splitTextToSize(
    (data.partyAddress || data.customerAddress || "").toUpperCase(),
    colW - 32
  );
  doc.text(addrLines, leftX + 30, boxTop + 18);

  // Right column values
  doc.text((data.customerAddress || data.partyAddress || "Lahore").toUpperCase().split("\n")[0], leftX + colW + 32, boxTop + 6);
  const shipLines = doc.splitTextToSize(
    (data.partyAddress || data.customerAddress || "").toUpperCase(),
    colW - 4
  );
  doc.setFontSize(9);
  doc.text(shipLines, leftX + colW + 2, boxTop + 14);
  doc.setFontSize(10);
  doc.text(data.partyContactPerson || data.customerName || "", leftX + colW + 38, boxTop + 28);
  doc.text(data.partyContactNo || data.customerPhone || "", leftX + colW + 38, boxTop + 36);

  // === Return Invoice No / Date small box ===
  const ribTop = boxTop + boxH + 4;
  const ribW = 70;
  const ribH = 18;
  doc.rect(leftX, ribTop, ribW, ribH);
  doc.line(leftX, ribTop + 9, leftX + ribW, ribTop + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Return Invoice No", leftX + 2, ribTop + 4);
  doc.text("Return Invoice Date", leftX + 2, ribTop + 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(String(data.receiptNo), leftX + 40, ribTop + 6);
  doc.text(data.dateStr, leftX + 40, ribTop + 15);

  // === Items table ===
  const tableTop = ribTop + ribH + 6;
  const headerH = 8;
  const colDesc = 80;
  const colPart = 30;
  const colQty = 15;
  const colRate = 25;
  const colTotal = contentW - (colDesc + colPart + colQty + colRate);
  let x = leftX;

  doc.setLineWidth(0.3);
  doc.setFillColor(245, 245, 245);
  doc.rect(leftX, tableTop, contentW, headerH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text("Description", x + 2, tableTop + 5); x += colDesc;
  doc.text("Part No", x + 2, tableTop + 5); x += colPart;
  doc.text("Qty", x + colQty / 2, tableTop + 5, { align: "center" }); x += colQty;
  doc.text("Rate", x + colRate - 2, tableTop + 5, { align: "right" }); x += colRate;
  doc.text("Total Value", x + colTotal - 2, tableTop + 5, { align: "right" });

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let rowY = tableTop + headerH;
  const rowH = 10;

  data.items.forEach((it) => {
    x = leftX;
    const lineTotal = it.quantity * it.price;
    doc.rect(leftX, rowY, contentW, rowH);
    const nameLines = doc.splitTextToSize(it.name, colDesc - 4);
    doc.text(nameLines.slice(0, 2), x + 2, rowY + 4); x += colDesc;
    doc.text(it.partNo || "", x + 2, rowY + 6); x += colPart;
    doc.text(String(it.quantity), x + colQty / 2, rowY + 6, { align: "center" }); x += colQty;
    doc.text(formatCurrency(it.price), x + colRate - 2, rowY + 6, { align: "right" }); x += colRate;
    doc.text(formatCurrency(lineTotal), x + colTotal - 2, rowY + 6, { align: "right" });
    rowY += rowH;
  });

  // Total row
  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
  doc.setFillColor(250, 250, 250);
  doc.rect(leftX, rowY, contentW, rowH, "FD");
  doc.setFont("helvetica", "bold");
  x = leftX;
  doc.text("TOTAL:", x + colDesc + colPart - 4, rowY + 6, { align: "right" });
  x += colDesc + colPart;
  doc.text(String(totalQty), x + colQty / 2, rowY + 6, { align: "center" }); x += colQty;
  x += colRate;
  doc.text(formatCurrency(data.total), x + colTotal - 2, rowY + 6, { align: "right" });

  rowY += rowH + 8;

  // Amount in words
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("AMOUNT IN WORDS :", leftX, rowY);
  doc.setTextColor(20, 20, 20);
  const words = `${numberToWords(data.total)} Only`;
  const wordLines = doc.splitTextToSize(words, contentW - 50);
  doc.text(wordLines, leftX + 45, rowY);

  // Notes (optional)
  if (data.notes && data.notes.trim()) {
    rowY += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", leftX, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    const noteLines = doc.splitTextToSize(data.notes.trim(), contentW);
    doc.text(noteLines, leftX, rowY + 5);
  }

  // Signature lines
  const sigY = 250;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(leftX + 15, sigY, leftX + 75, sigY);
  doc.line(rightX - 75, sigY, rightX - 15, sigY);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Prepared By", leftX + 45, sigY + 6, { align: "center" });
  doc.text("Approved By", rightX - 45, sigY + 6, { align: "center" });

  return doc;
};

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
