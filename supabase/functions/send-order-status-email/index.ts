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

const getStatusContent = (status: string, orderId: string, customerName: string, trackingNumber?: string, trackingUrl?: string) => {
  const orderIdShort = orderId.slice(0, 8).toUpperCase();
  
  const statusConfig: Record<string, { emoji: string; title: string; message: string; color: string }> = {
    processing: {
      emoji: "⚙️",
      title: "Your Order is Being Processed",
      message: "Great news! We've started processing your order. Our team is preparing your items for shipment.",
      color: "#3b82f6",
    },
    shipped: {
      emoji: "🚚",
      title: "Your Order Has Been Shipped!",
      message: "Exciting news! Your order is on its way to you. You can track your package using the tracking information below.",
      color: "#8b5cf6",
    },
    delivered: {
      emoji: "✅",
      title: "Your Order Has Been Delivered!",
      message: "Your order has been successfully delivered. We hope you love your purchase!",
      color: "#22c55e",
    },
    cancelled: {
      emoji: "❌",
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you have any questions, please contact our support team.",
      color: "#ef4444",
    },
  };

  const config = statusConfig[status] || {
    emoji: "📦",
    title: "Order Update",
    message: `Your order status has been updated to: ${status}`,
    color: "#f97316",
  };

  const trackingSection = status === "shipped" && trackingNumber ? `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tracking Number</p>
      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #333; font-family: monospace;">${trackingNumber}</p>
      ${trackingUrl ? `
        <a href="${trackingUrl}" target="_blank" style="display: inline-block; margin-top: 15px; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Track Your Package →
        </a>
      ` : ''}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">${config.emoji}</div>
        <h1 style="color: white; margin: 0; font-size: 24px;">${config.title}</h1>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Dear <strong>${customerName}</strong>,</p>
        
        <p>${config.message}</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Order ID</p>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #f97316;">#${orderIdShort}</p>
        </div>

        ${trackingSection}
        
        <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
          <p style="margin: 0; font-size: 14px;"><strong>📋 Order Status Timeline</strong></p>
          <div style="margin-top: 15px; font-size: 13px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="width: 20px; height: 20px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 10px;"></span>
              <span>Order Placed</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="width: 20px; height: 20px; border-radius: 50%; background: ${status === 'processing' || status === 'shipped' || status === 'delivered' ? '#22c55e' : '#ddd'}; display: inline-block; margin-right: 10px;"></span>
              <span style="color: ${status === 'processing' || status === 'shipped' || status === 'delivered' ? '#333' : '#999'};">Processing</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="width: 20px; height: 20px; border-radius: 50%; background: ${status === 'shipped' || status === 'delivered' ? '#22c55e' : '#ddd'}; display: inline-block; margin-right: 10px;"></span>
              <span style="color: ${status === 'shipped' || status === 'delivered' ? '#333' : '#999'};">Shipped</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="width: 20px; height: 20px; border-radius: 50%; background: ${status === 'delivered' ? '#22c55e' : '#ddd'}; display: inline-block; margin-right: 10px;"></span>
              <span style="color: ${status === 'delivered' ? '#333' : '#999'};">Delivered</span>
            </div>
          </div>
        </div>
        
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          Questions? Contact us at <a href="tel:0300-4649141" style="color: #f97316;">0300-4649141</a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
        <p>Model Town, Lahore</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, orderId, status, trackingNumber, trackingUrl }: StatusUpdateRequest = await req.json();

    console.log("Sending status update email to:", customerEmail, "Status:", status);

    // Only send emails for meaningful status changes
    const notifiableStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!notifiableStatuses.includes(status)) {
      console.log("Status not notifiable, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const statusTitles: Record<string, string> = {
      processing: "Your Order is Being Processed",
      shipped: "Your Order Has Been Shipped!",
      delivered: "Your Order Has Been Delivered!",
      cancelled: "Order Cancelled",
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [customerEmail],
        subject: `${statusTitles[status] || 'Order Update'} - #${orderId.slice(0, 8).toUpperCase()}`,
        html: getStatusContent(status, orderId, customerName, trackingNumber, trackingUrl),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(error);
    }

    const data = await res.json();
    console.log("Status update email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending status update email:", error);
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
