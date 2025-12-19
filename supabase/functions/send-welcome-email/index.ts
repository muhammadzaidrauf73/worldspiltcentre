import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const displayName = name || "Valued Customer";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to World Spilt Centre! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome! 🎉</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You're now part of the World Spilt Centre family</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px;">Dear <strong>${displayName}</strong>,</p>
              
              <p>Thank you for creating an account with World Spilt Centre! We're thrilled to have you join our community of smart shoppers.</p>
              
              <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f97316;">
                <h3 style="margin: 0 0 15px 0; color: #c2410c;">🌟 What You Can Expect</h3>
                <ul style="margin: 0; padding-left: 20px; color: #9a3412;">
                  <li style="margin-bottom: 8px;">Access to exclusive deals and promotions</li>
                  <li style="margin-bottom: 8px;">Early access to new arrivals</li>
                  <li style="margin-bottom: 8px;">Track your orders easily</li>
                  <li style="margin-bottom: 8px;">Save your favorite products to wishlist</li>
                  <li>Faster checkout experience</li>
                </ul>
              </div>
              
              <h3 style="border-bottom: 2px solid #f97316; padding-bottom: 10px;">Popular Categories</h3>
              
              <div style="margin: 20px 0;">
                <span style="display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 4px;">📺 LED TVs</span>
                <span style="display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 4px;">🌀 AC & Cooling</span>
                <span style="display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 4px;">🧺 Washing Machines</span>
                <span style="display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 4px;">🍳 Kitchen Appliances</span>
              </div>
              
              <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                <p style="margin: 0; font-size: 14px;"><strong>💡 Pro Tip:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Complete your profile to get personalized recommendations and faster checkout!</p>
              </div>
              
              <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                Need help? Call us at <a href="tel:0300-4649141" style="color: #f97316; text-decoration: none; font-weight: bold;">0300-4649141</a><br>
                or visit our store in Model Town, Lahore
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
              <p>Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore</p>
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
    console.log("Welcome email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
