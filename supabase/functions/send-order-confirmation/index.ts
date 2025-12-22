import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  coupon?: {
    code: string;
    discount: number;
  } | null;
  isGuestOrder?: boolean;
  siteUrl?: string;
}

function generateInvoicePDF(data: OrderConfirmationRequest): string {
  const doc = new jsPDF();
  const orderIdShort = data.orderId.slice(0, 8).toUpperCase();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(5, 150, 105);
  doc.text("World Spilt Centre", 20, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("INVOICE", 160, 25);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Invoice #: ${orderIdShort}`, 140, 35);
  doc.text(`Date: ${new Date().toLocaleDateString('en-PK')}`, 140, 42);
  
  // Divider
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  // Customer details
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Bill To:", 20, 62);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.customerName, 20, 70);
  doc.text(data.customerEmail, 20, 77);
  if (data.customerPhone) {
    doc.text(data.customerPhone, 20, 84);
  }
  
  // Shipping address
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Ship To:", 110, 62);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const addressLines = doc.splitTextToSize(data.shippingAddress, 80);
  let yPos = 70;
  addressLines.forEach((line: string) => {
    doc.text(line, 110, yPos);
    yPos += 7;
  });
  
  // Items table header
  const tableStartY = Math.max(yPos + 15, 100);
  doc.setFillColor(249, 250, 251);
  doc.rect(20, tableStartY - 6, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Product", 25, tableStartY);
  doc.text("Qty", 120, tableStartY);
  doc.text("Price", 140, tableStartY);
  doc.text("Total", 165, tableStartY);
  
  // Items
  let itemY = tableStartY + 12;
  doc.setTextColor(60, 60, 60);
  
  data.items.forEach((item) => {
    const itemName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
    doc.text(itemName, 25, itemY);
    doc.text(item.quantity.toString(), 120, itemY);
    doc.text(`Rs. ${item.price.toLocaleString()}`, 140, itemY);
    doc.text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, 165, itemY);
    itemY += 10;
  });
  
  // Divider before totals
  doc.setDrawColor(220, 220, 220);
  doc.line(20, itemY + 2, 190, itemY + 2);
  
  // Totals section
  const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = data.total - subtotal + (data.coupon?.discount || 0);
  
  itemY += 12;
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal:", 140, itemY);
  doc.setTextColor(60, 60, 60);
  doc.text(`Rs. ${subtotal.toLocaleString()}`, 165, itemY);
  
  if (data.coupon && data.coupon.discount > 0) {
    itemY += 8;
    doc.setTextColor(5, 150, 105);
    doc.text(`Discount (${data.coupon.code}):`, 125, itemY);
    doc.text(`-Rs. ${data.coupon.discount.toLocaleString()}`, 165, itemY);
  }
  
  itemY += 8;
  doc.setTextColor(100, 100, 100);
  doc.text("Shipping:", 140, itemY);
  doc.setTextColor(60, 60, 60);
  doc.text(shipping > 0 ? `Rs. ${shipping.toLocaleString()}` : "FREE", 165, itemY);
  
  itemY += 12;
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text("Total:", 140, itemY);
  doc.text(`Rs. ${data.total.toLocaleString()}`, 165, itemY);
  
  // Payment method
  itemY += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Payment Method: Cash on Delivery", 20, itemY);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for shopping with World Spilt Centre!", 20, 270);
  doc.text("Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore", 20, 277);
  doc.text("Phone: 0300-4649141 | Email: support@worldspiltcentre.com", 20, 284);
  
  // Return base64 encoded PDF
  return doc.output('datauristring').split(',')[1];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== Order confirmation function started ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body));
    
    const { customerEmail, customerName, customerPhone, orderId, items, total, shippingAddress, coupon, isGuestOrder, siteUrl }: OrderConfirmationRequest = body;

    if (!customerEmail || !orderId) {
      console.error("Missing required fields:", { customerEmail: !!customerEmail, orderId: !!orderId });
      throw new Error("Missing required fields: customerEmail or orderId");
    }

    console.log(`Preparing email for: ${customerEmail}, Order: ${orderId}, Guest: ${isGuestOrder}`);
    
    // Build tracking URL
    const baseUrl = siteUrl || "https://worldspiltcentre.com";
    const trackingUrl = isGuestOrder 
      ? `${baseUrl}/order-tracking?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}`
      : `${baseUrl}/order-tracking?orderId=${orderId}`;

    // Generate PDF invoice
    console.log("Generating PDF invoice...");
    const pdfBase64 = generateInvoicePDF({ customerEmail, customerName, customerPhone, orderId, items, total, shippingAddress, coupon });
    console.log("PDF generated successfully");

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderIdShort = orderId.slice(0, 8).toUpperCase();

    // Build totals HTML with coupon discount if applied
    let totalsHtml = `
      <tr>
        <td style="color: #666666; padding: 5px 0;">Subtotal</td>
        <td style="text-align: right; color: #333333; padding: 5px 0;">Rs. ${subtotal.toLocaleString()}</td>
      </tr>
    `;

    if (coupon && coupon.discount > 0) {
      totalsHtml += `
        <tr>
          <td style="color: #059669; padding: 5px 0;">Discount (${coupon.code})</td>
          <td style="text-align: right; color: #059669; padding: 5px 0;">-Rs. ${coupon.discount.toLocaleString()}</td>
        </tr>
      `;
    }

    const shippingCost = total - subtotal + (coupon?.discount || 0);
    totalsHtml += `
      <tr>
        <td style="color: #666666; padding: 5px 0;">Shipping</td>
        <td style="text-align: right; color: #333333; padding: 5px 0;">${shippingCost > 0 ? 'Rs. ' + shippingCost.toLocaleString() : 'FREE'}</td>
      </tr>
      <tr style="border-top: 1px solid #dddddd;">
        <td style="color: #333333; padding: 10px 0 5px 0; font-weight: bold; font-size: 16px;">Total</td>
        <td style="text-align: right; color: #059669; padding: 10px 0 5px 0; font-weight: bold; font-size: 16px;">Rs. ${total.toLocaleString()}</td>
      </tr>
    `;

    console.log("Sending email via Resend API with PDF attachment...");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [customerEmail],
        subject: `Order Confirmation #${orderIdShort} - World Spilt Centre`,
        attachments: [
          {
            filename: `Invoice-${orderIdShort}.pdf`,
            content: pdfBase64,
          }
        ],
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            
            <div style="border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px;">
              <h2 style="color: #059669; margin: 0; font-size: 20px;">World Spilt Centre</h2>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 13px;">Order Confirmation</p>
            </div>
            
            <p style="font-size: 15px; margin-bottom: 20px;">Dear ${customerName},</p>
            
            <p style="color: #333333; font-size: 15px; margin-bottom: 20px;">
              Thank you for your order. We have received it and will begin processing shortly. Your invoice is attached to this email.
            </p>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0;">
              <p style="margin: 0; font-size: 13px; color: #047857;">Order Reference</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #065f46;">#${orderIdShort}</p>
            </div>
            
            <h3 style="color: #333333; font-size: 16px; margin: 25px 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Order Details</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; color: #333333; font-size: 13px; border-bottom: 2px solid #eeeeee;">Product</th>
                  <th style="padding: 12px; text-align: center; color: #333333; font-size: 13px; border-bottom: 2px solid #eeeeee;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #333333; font-size: 13px; border-bottom: 2px solid #eeeeee;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <table style="width: 100%;">
                ${totalsHtml}
              </table>
            </div>
            
            <h3 style="color: #333333; font-size: 16px; margin: 25px 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Delivery Address</h3>
            <p style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 0; color: #333333;">${shippingAddress}</p>
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
              <p style="margin: 0; font-weight: bold; color: #0369a1; font-size: 14px;">📎 Invoice Attached</p>
              <p style="margin: 5px 0 0 0; color: #0284c7; font-size: 13px;">Your invoice PDF is attached to this email for your records.</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 14px;">Track Your Order</a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 14px;">What happens next?</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #a16207; font-size: 13px;">
                <li>We will process your order within 24 hours</li>
                <li>You will receive a shipping notification with tracking details</li>
                <li>Expected delivery: 3-5 business days</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>Questions about your order?</strong></p>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #555555;">
                Phone: 0300-4649141 (Mon-Sat, 10 AM - 8 PM)
              </p>
              <p style="margin: 0; font-size: 14px; color: #555555;">
                Email: support@worldspiltcentre.com
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888;">
              <p style="margin: 0 0 5px 0;">World Spilt Centre</p>
              <p style="margin: 0 0 5px 0;">Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    console.log("Resend API response status:", res.status);

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error response:", error);
      throw new Error(error);
    }

    const data = await res.json();
    console.log("Order confirmation email with invoice sent successfully:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in order confirmation function:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
