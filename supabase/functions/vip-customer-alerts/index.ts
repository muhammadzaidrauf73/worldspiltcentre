import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerData {
  userId: string;
  name: string;
  email: string;
  totalSpent: number;
  lastOrderDate: Date;
  daysSinceLastOrder: number;
  orderCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("VIP Customer Alerts function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse request body for optional parameters
    let adminEmail = "admin@worldspiltcentre.com";
    let inactiveDaysThreshold = 30;
    let vipThreshold = 50000;

    try {
      const body = await req.json();
      if (body.adminEmail) adminEmail = body.adminEmail;
      if (body.inactiveDays) inactiveDaysThreshold = body.inactiveDays;
      if (body.vipThreshold) vipThreshold = body.vipThreshold;
    } catch {
      // Use defaults if no body
    }

    console.log(`Checking for VIP customers (>= Rs.${vipThreshold}) inactive for ${inactiveDaysThreshold}+ days`);

    // Fetch company settings for admin email
    const { data: settings } = await supabaseAdmin
      .from("company_settings")
      .select("key, value")
      .eq("key", "email")
      .maybeSingle();

    if (settings?.value) {
      adminEmail = settings.value;
    }

    // Fetch all orders with user data
    const { data: allOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, customer_name, customer_email, total, created_at, status")
      .not("user_id", "is", null)
      .neq("status", "cancelled");

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error("Failed to fetch orders");
    }

    console.log(`Found ${allOrders?.length || 0} orders to analyze`);

    // Group orders by user
    const customerMap: Record<string, CustomerData> = {};

    allOrders?.forEach((order) => {
      if (!order.user_id) return;

      const orderDate = new Date(order.created_at);

      if (!customerMap[order.user_id]) {
        customerMap[order.user_id] = {
          userId: order.user_id,
          name: order.customer_name || "Customer",
          email: order.customer_email || "",
          totalSpent: 0,
          lastOrderDate: orderDate,
          daysSinceLastOrder: 0,
          orderCount: 0,
        };
      }

      const customer = customerMap[order.user_id];
      customer.totalSpent += Number(order.total);
      customer.orderCount += 1;

      // Update name and email if we have better data
      if (order.customer_name && order.customer_name !== "Customer") {
        customer.name = order.customer_name;
      }
      if (order.customer_email) {
        customer.email = order.customer_email;
      }

      // Track most recent order
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    // Calculate days since last order and filter VIP customers
    const now = new Date();
    const inactiveVipCustomers: CustomerData[] = [];

    Object.values(customerMap).forEach((customer) => {
      customer.daysSinceLastOrder = Math.floor(
        (now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if VIP (spent >= threshold) and inactive (>= days threshold)
      if (customer.totalSpent >= vipThreshold && customer.daysSinceLastOrder >= inactiveDaysThreshold) {
        inactiveVipCustomers.push(customer);
      }
    });

    console.log(`Found ${inactiveVipCustomers.length} inactive VIP customers`);

    if (inactiveVipCustomers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No inactive VIP customers found",
          inactiveCount: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sort by total spent (highest first)
    inactiveVipCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Build email content
    const customerRows = inactiveVipCustomers
      .map(
        (c) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px;">${c.name}</td>
          <td style="padding: 12px;">${c.email || "N/A"}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; color: #059669;">Rs.${c.totalSpent.toLocaleString()}</td>
          <td style="padding: 12px; text-align: center;">${c.orderCount}</td>
          <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: bold;">${c.daysSinceLastOrder} days</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VIP Customer Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">👑 VIP Customer Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Inactive High-Value Customers Detected</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
              <strong style="color: #92400e;">⚠️ Attention Required</strong>
              <p style="color: #92400e; margin: 5px 0 0; font-size: 14px;">
                ${inactiveVipCustomers.length} VIP customer${inactiveVipCustomers.length > 1 ? "s have" : " has"} not placed an order in over ${inactiveDaysThreshold} days.
              </p>
            </div>

            <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Inactive VIP Customers</h2>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; color: #6b7280;">Customer</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280;">Email</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280;">Total Spent</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280;">Orders</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280;">Inactive</th>
                  </tr>
                </thead>
                <tbody>
                  ${customerRows}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 25px; padding: 20px; background: #f0fdf4; border-radius: 8px;">
              <h3 style="color: #166534; margin: 0 0 10px; font-size: 16px;">💡 Re-engagement Suggestions</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Send a personalized "We miss you" email with an exclusive discount</li>
                <li>Offer early access to new products or flash deals</li>
                <li>Reach out via phone for a personal touch</li>
                <li>Create a VIP-only loyalty reward</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated alert from your store's analytics system.<br>
              Generated on ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    console.log(`Sending VIP alert email to ${adminEmail}`);

    const emailResponse = await resend.emails.send({
      from: "World Spilt Centre <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `👑 VIP Alert: ${inactiveVipCustomers.length} high-value customer${inactiveVipCustomers.length > 1 ? "s" : ""} inactive for ${inactiveDaysThreshold}+ days`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent for ${inactiveVipCustomers.length} inactive VIP customers`,
        inactiveCount: inactiveVipCustomers.length,
        emailSentTo: adminEmail,
        customers: inactiveVipCustomers.map((c) => ({
          name: c.name,
          totalSpent: c.totalSpent,
          daysSinceLastOrder: c.daysSinceLastOrder,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in VIP customer alerts:", error);
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
