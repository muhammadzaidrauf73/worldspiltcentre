import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  orderId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, orderId, items, total, shippingAddress }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [customerEmail],
        subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed! 🎉</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">Dear <strong>${customerName}</strong>,</p>
              
              <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">Order ID</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #f97316;">#${orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <h3 style="border-bottom: 2px solid #f97316; padding-bottom: 10px;">Order Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left;">Item</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 15px; font-weight: bold; font-size: 18px;">Total</td>
                    <td style="padding: 15px; font-weight: bold; font-size: 18px; text-align: right; color: #f97316;">Rs. ${total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <h3 style="border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 8px;">${shippingAddress}</p>
              
              <div style="margin-top: 30px; padding: 20px; background: #fef3cd; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px;"><strong>📦 What's Next?</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">We'll notify you once your order is shipped. You can track your order status from your account.</p>
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
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(error);
    }

    const data = await res.json();
    console.log("Order confirmation email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation:", error);
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
