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
  console.log("Order confirmation function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { customerEmail, customerName, orderId, items, total, shippingAddress }: OrderConfirmationRequest = body;

    if (!customerEmail || !orderId) {
      console.error("Missing required fields:", { customerEmail, orderId });
      throw new Error("Missing required fields: customerEmail or orderId");
    }

    console.log("Sending order confirmation to:", customerEmail, "for order:", orderId);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name}</td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #059669; font-weight: 600; font-size: 14px;">Rs. ${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [customerEmail],
        subject: `🎉 Order Confirmed - #${orderId.slice(0, 8).toUpperCase()} | World Spilt Centre`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 40px 30px; text-align: center;">
              <div style="background: rgba(255,255,255,0.15); display: inline-block; padding: 12px 24px; border-radius: 50px; margin-bottom: 16px;">
                <span style="color: white; font-size: 14px; font-weight: 600; letter-spacing: 1px;">ORDER CONFIRMED</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Thank You for Your Order! 🎉</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 15px;">We've received your order and are getting it ready</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
              
              <!-- Greeting -->
              <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong style="color: #059669;">${customerName}</strong>,</p>
              
              <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Your order has been successfully placed and is being prepared for shipment. We're thrilled to have you as our customer!</p>
              
              <!-- Order ID Box -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #a7f3d0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #047857; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Order Reference</p>
                <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #065f46; letter-spacing: 2px;">#${orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <!-- Order Items -->
              <h3 style="color: #059669; font-size: 16px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #059669;">📦 Your Items</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
                    <th style="padding: 14px 12px; text-align: left; color: #047857; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Product</th>
                    <th style="padding: 14px 12px; text-align: center; color: #047857; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Qty</th>
                    <th style="padding: 14px 12px; text-align: right; color: #047857; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Total Box -->
              <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="color: rgba(255,255,255,0.9); font-size: 14px;">Subtotal</td>
                    <td style="color: white; font-size: 14px; text-align: right;">Rs. ${subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="color: rgba(255,255,255,0.9); font-size: 14px; padding-top: 8px;">Shipping</td>
                    <td style="color: white; font-size: 14px; text-align: right; padding-top: 8px;">${total > subtotal ? 'Rs. ' + (total - subtotal).toLocaleString() : 'FREE'}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); margin-top: 12px;"></td>
                  </tr>
                  <tr>
                    <td style="color: white; font-size: 18px; font-weight: 700; padding-top: 4px;">Total</td>
                    <td style="color: #fef3c7; font-size: 22px; font-weight: 700; text-align: right; padding-top: 4px;">Rs. ${total.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Shipping Address -->
              <h3 style="color: #059669; font-size: 16px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #059669;">🚚 Delivery Address</h3>
              <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.8;">${shippingAddress}</p>
              </div>
              
              <!-- Next Steps -->
              <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 1px solid #fcd34d;">
                <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 600;">⏳ What Happens Next?</h4>
                <ol style="margin: 0; padding-left: 20px; color: #a16207; font-size: 14px;">
                  <li style="margin-bottom: 8px;">We'll process your order within 24 hours</li>
                  <li style="margin-bottom: 8px;">You'll receive a shipping confirmation email with tracking details</li>
                  <li>Expected delivery: 3-5 business days</li>
                </ol>
              </div>
              
              <!-- Contact -->
              <div style="margin-top: 32px; text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Have questions about your order?</p>
                <p style="margin: 0;">
                  <a href="tel:0300-4649141" style="color: #059669; font-weight: 600; font-size: 18px; text-decoration: none;">📞 0300-4649141</a>
                </p>
                <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">We're here to help!</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 24px; background: #1f2937;">
              <p style="margin: 0 0 8px 0; color: #f3f4f6; font-size: 14px; font-weight: 600;">World Spilt Centre</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore</p>
              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 11px;">© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
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
    console.log("Order confirmation email sent successfully:", data);

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
