import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface OrderData {
  products: OrderItem[];
  coupon?: {
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
  } | null;
  shipping?: {
    name: string;
    price: number;
  } | null;
}

const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Fetch company settings
    const { data: settings } = await supabaseAdmin
      .from("company_settings")
      .select("key, value")
      .in("key", ["company_name", "phone", "email", "address"]);

    const companySettings = settings?.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {}) || {};

    // Parse order items
    const rawItems = order.items;
    let items: OrderItem[] = [];
    let couponInfo = null;
    let shippingInfo = null;

    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === "object") {
      items = rawItems.products || [];
      couponInfo = rawItems.coupon || null;
      shippingInfo = rawItems.shipping || null;
    }

    // Calculate subtotal from items
    let subtotal = 0;
    items.forEach((item) => {
      subtotal += (item.quantity || 1) * (Number(item.price) || 0);
    });

    // Calculate shipping cost
    const shippingCost = shippingInfo?.price || 0;
    
    // Calculate discount amount
    const discountAmount = couponInfo?.discount_amount || 0;
    
    // Calculate expected total
    const expectedTotal = subtotal + shippingCost - discountAmount;
    
    // Use order.total as the final total (it's the source of truth)
    const finalTotal = Number(order.total);

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - Company Logo/Name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text(companySettings.company_name || "World Spilt Centre", 20, 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(companySettings.address || "Model Town, Lahore", 20, 32);
    doc.text(`Phone: ${companySettings.phone || "0300-4649141"}`, 20, 37);
    doc.text(`Email: ${companySettings.email || "support@worldspiltcentre.com"}`, 20, 42);

    // Invoice title and details (right side)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: INV-${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 33, { align: "right" });
    doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 38, { align: "right" });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-PK", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}`, pageWidth - 20, 43, { align: "right" });
    
    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
      pending: [255, 193, 7],
      confirmed: [0, 123, 255],
      processing: [108, 117, 125],
      shipped: [23, 162, 184],
      delivered: [40, 167, 69],
      cancelled: [220, 53, 69]
    };
    const statusColor = statusColors[order.status] || [100, 100, 100];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, pageWidth - 20, 48, { align: "right" });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 55, pageWidth - 20, 55);

    // Bill To section
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 65);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_name || "Customer", 20, 72);
    if (order.customer_email) {
      doc.setTextColor(100, 100, 100);
      doc.text(order.customer_email, 20, 78);
    }
    if (order.customer_phone) {
      doc.setTextColor(100, 100, 100);
      doc.text(order.customer_phone, 20, 84);
    }
    
    // Ship To section
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ship To:", pageWidth / 2, 65);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const addressLines = (order.shipping_address || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    let addressY = 72;
    addressLines.slice(0, 4).forEach((line: string) => {
      doc.text(line, pageWidth / 2, addressY);
      addressY += 6;
    });

    // Items table header
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

    // Items rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    let y = tableTop + 15;

    items.forEach((item, index) => {
      const itemTotal = (item.quantity || 1) * (Number(item.price) || 0);
      
      const itemName = item.name || "Product";
      const truncatedName = itemName.length > 45 ? itemName.substring(0, 45) + "..." : itemName;
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(252, 252, 252);
        doc.rect(20, y - 5, pageWidth - 40, 10, "F");
      }
      
      doc.setFontSize(9);
      doc.text(truncatedName, 25, y);
      doc.text(String(item.quantity || 1), pageWidth - 85, y, { align: "center" });
      doc.text(formatCurrency(Number(item.price || 0)), pageWidth - 55, y, { align: "right" });
      doc.text(formatCurrency(itemTotal), pageWidth - 25, y, { align: "right" });
      
      y += 10;
    });

    // Totals section
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(pageWidth - 100, y, pageWidth - 20, y);
    y += 12;

    // Subtotal
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", pageWidth - 65, y, { align: "right" });
    doc.setTextColor(55, 65, 81);
    doc.text(formatCurrency(subtotal), pageWidth - 25, y, { align: "right" });
    y += 8;

    // Shipping
    if (shippingInfo || shippingCost > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Shipping${shippingInfo?.name ? ` (${shippingInfo.name})` : ""}:`, pageWidth - 65, y, { align: "right" });
      doc.setTextColor(55, 65, 81);
      doc.text(shippingCost === 0 ? "FREE" : formatCurrency(shippingCost), pageWidth - 25, y, { align: "right" });
      y += 8;
    }

    // Discount
    if (couponInfo && discountAmount > 0) {
      doc.setTextColor(22, 163, 74); // Green color
      doc.text(`Discount (${couponInfo.code}):`, pageWidth - 65, y, { align: "right" });
      doc.text(`-${formatCurrency(discountAmount)}`, pageWidth - 25, y, { align: "right" });
      y += 8;
    }

    // Divider before total
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth - 100, y, pageWidth - 20, y);
    y += 10;

    // Grand Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("TOTAL:", pageWidth - 65, y, { align: "right" });
    doc.setTextColor(220, 38, 38); // Red color for total
    doc.text(formatCurrency(finalTotal), pageWidth - 25, y, { align: "right" });

    // Payment Info Box
    y += 20;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, y, pageWidth - 40, 25, 3, 3, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99);
    doc.text("Payment Information", 28, y + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Payment Method: Cash on Delivery (COD)", 28, y + 16);
    doc.text(`Amount Due: ${formatCurrency(finalTotal)}`, 28, y + 22);

    // Footer
    const footerY = 265;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with us!", pageWidth / 2, footerY, { align: "center" });
    doc.text("For any queries, please contact us at the above details.", pageWidth / 2, footerY + 5, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, pageWidth / 2, footerY + 10, { align: "center" });

    // Generate PDF as base64
    const pdfOutput = doc.output("datauristring");

    console.log(`Invoice generated for order ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfOutput,
        filename: `invoice-INV-${order.id.slice(0, 8).toUpperCase()}.pdf`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
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
