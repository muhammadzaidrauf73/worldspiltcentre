import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterWelcomeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterWelcomeRequest = await req.json();

    console.log("Sending newsletter welcome email to:", email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [email],
        subject: "Welcome to World Spilt Centre Newsletter! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">You're In! 🎉</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Welcome to the World Spilt Centre family</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">Thank you for subscribing to our newsletter!</p>
              
              <p>You're now part of an exclusive group who gets:</p>
              
              <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f97316;">
                <ul style="margin: 0; padding-left: 20px; color: #9a3412;">
                  <li style="margin-bottom: 8px;"><strong>10% OFF</strong> your first order</li>
                  <li style="margin-bottom: 8px;">Early access to flash deals</li>
                  <li style="margin-bottom: 8px;">Exclusive member-only discounts</li>
                  <li style="margin-bottom: 8px;">New arrival announcements</li>
                  <li>Special seasonal promotions</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://worldspiltcentre.com/products" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Start Shopping →
                </a>
              </div>
              
              <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                <p style="margin: 0; font-size: 14px;"><strong>🎁 Your Welcome Gift</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Use code <strong style="color: #f97316; font-size: 16px;">WELCOME10</strong> at checkout to get 10% off your first order!</p>
              </div>
              
              <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                Questions? Contact us at <a href="tel:0300-4649141" style="color: #f97316; text-decoration: none; font-weight: bold;">0300-4649141</a>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
              <p>Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore</p>
              <p style="margin-top: 10px;">
                <a href="https://worldspiltcentre.com/unsubscribe" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </p>
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
    console.log("Newsletter welcome email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending newsletter welcome email:", error);
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
