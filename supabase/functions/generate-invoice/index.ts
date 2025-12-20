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
}

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

    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === "object") {
      items = rawItems.products || [];
      couponInfo = rawItems.coupon || null;
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.company_name || "World Spilt Centre", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(companySettings.address || "Model Town, Lahore", 20, 32);
    doc.text(`Phone: ${companySettings.phone || "0300-4649141"}`, 20, 37);
    doc.text(`Email: ${companySettings.email || "support@worldspiltcentre.com"}`, 20, 42);

    // Invoice title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 32, { align: "right" });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}`, pageWidth - 20, 37, { align: "right" });
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, pageWidth - 20, 42, { align: "right" });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 50, pageWidth - 20, 50);

    // Bill To
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 60);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_name || "Customer", 20, 67);
    doc.text(order.customer_email || "", 20, 72);
    doc.text(order.customer_phone || "", 20, 77);
    
    // Ship To
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Ship To:", pageWidth / 2, 60);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const addressLines = (order.shipping_address || "").split(",");
    let addressY = 67;
    addressLines.forEach((line: string) => {
      doc.text(line.trim(), pageWidth / 2, addressY);
      addressY += 5;
    });

    // Items table header
    const tableTop = 95;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, tableTop - 5, pageWidth - 40, 10, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Item", 25, tableTop);
    doc.text("Qty", pageWidth - 80, tableTop, { align: "center" });
    doc.text("Price", pageWidth - 50, tableTop, { align: "right" });
    doc.text("Total", pageWidth - 25, tableTop, { align: "right" });

    // Items
    doc.setFont("helvetica", "normal");
    let y = tableTop + 12;
    let subtotal = 0;

    items.forEach((item) => {
      const itemTotal = (item.quantity || 1) * (Number(item.price) || 0);
      subtotal += itemTotal;
      
      const itemName = item.name || "Product";
      const truncatedName = itemName.length > 40 ? itemName.substring(0, 40) + "..." : itemName;
      
      doc.text(truncatedName, 25, y);
      doc.text(String(item.quantity || 1), pageWidth - 80, y, { align: "center" });
      doc.text(`Rs.${Number(item.price || 0).toLocaleString()}`, pageWidth - 50, y, { align: "right" });
      doc.text(`Rs.${itemTotal.toLocaleString()}`, pageWidth - 25, y, { align: "right" });
      
      y += 8;
    });

    // Divider before totals
    y += 5;
    doc.setDrawColor(200);
    doc.line(pageWidth - 80, y, pageWidth - 20, y);
    y += 10;

    // Subtotal
    doc.text("Subtotal:", pageWidth - 60, y, { align: "right" });
    doc.text(`Rs.${subtotal.toLocaleString()}`, pageWidth - 25, y, { align: "right" });
    y += 7;

    // Coupon discount
    if (couponInfo && couponInfo.discount_amount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Discount (${couponInfo.code}):`, pageWidth - 60, y, { align: "right" });
      doc.text(`-Rs.${couponInfo.discount_amount.toLocaleString()}`, pageWidth - 25, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", pageWidth - 60, y, { align: "right" });
    doc.text(`Rs.${Number(order.total).toLocaleString()}`, pageWidth - 25, y, { align: "right" });

    // Footer
    const footerY = 270;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("Thank you for shopping with us!", pageWidth / 2, footerY, { align: "center" });
    doc.text("For any queries, please contact us at the above details.", pageWidth / 2, footerY + 5, { align: "center" });

    // Generate PDF as base64
    const pdfOutput = doc.output("datauristring");

    console.log(`Invoice generated for order ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfOutput,
        filename: `invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`
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
