import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== Order status email function started ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { customerEmail, customerName, orderId, status, trackingNumber, trackingUrl }: StatusUpdateRequest = body;

    if (!customerEmail || !orderId || !status) {
      console.error("Missing required fields");
      throw new Error("Missing required fields");
    }

    console.log(`Sending status update to: ${customerEmail}, Status: ${status}, Order: ${orderId}`);

    // Only send emails for meaningful status changes
    const notifiableStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!notifiableStatuses.includes(status)) {
      console.log("Status not notifiable, skipping email:", status);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const orderIdShort = orderId.slice(0, 8).toUpperCase();
    
    const statusInfo: Record<string, { title: string; subject: string; message: string; color: string }> = {
      processing: {
        title: "Order Being Processed",
        subject: `Order #${orderIdShort} is Being Processed`,
        message: "Your order is being processed. We are preparing your items for shipment.",
        color: "#3b82f6",
      },
      shipped: {
        title: "Order Shipped",
        subject: `Order #${orderIdShort} Has Been Shipped`,
        message: "Your order has been shipped and is on its way to you.",
        color: "#8b5cf6",
      },
      delivered: {
        title: "Order Delivered",
        subject: `Order #${orderIdShort} Has Been Delivered`,
        message: "Your order has been delivered. We hope you enjoy your purchase!",
        color: "#22c55e",
      },
      cancelled: {
        title: "Order Cancelled",
        subject: `Order #${orderIdShort} Has Been Cancelled`,
        message: "Your order has been cancelled. If you have any questions, please contact us.",
        color: "#ef4444",
      },
    };

    const info = statusInfo[status];
    
    const trackingSection = status === "shipped" && trackingNumber ? `
      <div style="background-color: #f3e8ff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #d8b4fe;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #7c3aed;">Tracking Information</p>
        <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #5b21b6; font-family: monospace;">${trackingNumber}</p>
        ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px;">Track Your Package</a>` : ''}
      </div>
    ` : '';

    console.log("Sending email via Resend API...");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [customerEmail],
        subject: `${info.subject} - World Spilt Centre`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            
            <div style="border-bottom: 2px solid ${info.color}; padding-bottom: 20px; margin-bottom: 30px;">
              <h2 style="color: ${info.color}; margin: 0; font-size: 20px;">World Spilt Centre</h2>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 13px;">Order Status Update</p>
            </div>
            
            <p style="font-size: 15px; margin-bottom: 20px;">Dear ${customerName},</p>
            
            <p style="color: #333333; font-size: 15px; margin-bottom: 20px;">${info.message}</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${info.color};">
              <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">Order Reference</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333333;">#${orderIdShort}</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #666666;">Status: <strong style="color: ${info.color};">${info.title}</strong></p>
            </div>
            
            ${trackingSection}
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #333333; font-size: 14px;">Order Status Timeline</p>
              <div style="font-size: 13px; color: #555555;">
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background-color: #22c55e; display: inline-block; margin-right: 10px;"></span>
                  <span>Order Placed</span>
                </div>
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${['processing', 'shipped', 'delivered'].includes(status) ? '#22c55e' : '#dddddd'}; display: inline-block; margin-right: 10px;"></span>
                  <span style="color: ${['processing', 'shipped', 'delivered'].includes(status) ? '#333333' : '#999999'};">Processing</span>
                </div>
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${['shipped', 'delivered'].includes(status) ? '#22c55e' : '#dddddd'}; display: inline-block; margin-right: 10px;"></span>
                  <span style="color: ${['shipped', 'delivered'].includes(status) ? '#333333' : '#999999'};">Shipped</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${status === 'delivered' ? '#22c55e' : '#dddddd'}; display: inline-block; margin-right: 10px;"></span>
                  <span style="color: ${status === 'delivered' ? '#333333' : '#999999'};">Delivered</span>
                </div>
              </div>
            </div>
            
            <div style="border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>Need help?</strong></p>
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
      console.error("Resend API error:", error);
      throw new Error(error);
    }

    const data = await res.json();
    console.log("Status update email sent successfully:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending status update email:", error.message);
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
