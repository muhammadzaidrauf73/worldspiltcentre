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
  console.log("Welcome email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { email, name }: WelcomeEmailRequest = body;

    if (!email) {
      console.error("Missing required field: email");
      throw new Error("Missing required field: email");
    }

    console.log("Sending welcome email to:", email);

    const displayName = name || "Valued Customer";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [email],
        subject: "🎉 Welcome to World Spilt Centre - Pakistan's Premier Electronics Store!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <div style="background: rgba(255,255,255,0.15); display: inline-block; padding: 12px 24px; border-radius: 50px; margin-bottom: 16px;">
                <span style="color: white; font-size: 14px; font-weight: 600; letter-spacing: 1px;">WELCOME ABOARD</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">You're Part of the Family! 🎉</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 15px;">Thank you for joining World Spilt Centre</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
              
              <!-- Greeting -->
              <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong style="color: #2563eb;">${displayName}</strong>,</p>
              
              <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Welcome to <strong>World Spilt Centre</strong> – Pakistan's trusted destination for premium home appliances and electronics. We're thrilled to have you as part of our growing family of smart shoppers!</p>
              
              <!-- Welcome Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #93c5fd; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🎊</div>
                <h2 style="margin: 0 0 8px 0; color: #1e40af; font-size: 20px;">Your Account is Ready!</h2>
                <p style="margin: 0; color: #3b82f6; font-size: 14px;">Start exploring thousands of products at unbeatable prices</p>
              </div>
              
              <!-- Benefits Section -->
              <h3 style="color: #2563eb; font-size: 16px; font-weight: 600; margin: 32px 0 20px 0; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">✨ Your Exclusive Benefits</h3>
              
              <div style="display: grid; gap: 16px;">
                <div style="background: #f9fafb; padding: 16px 20px; border-radius: 10px; border-left: 4px solid #10b981;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="font-size: 24px; margin-right: 12px;">🏷️</span>
                    <div>
                      <strong style="color: #065f46; font-size: 14px;">Exclusive Deals & Discounts</strong>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Access member-only prices and flash sales</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 16px 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="font-size: 24px; margin-right: 12px;">⚡</span>
                    <div>
                      <strong style="color: #92400e; font-size: 14px;">Early Access to New Arrivals</strong>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Be the first to shop latest products</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 16px 20px; border-radius: 10px; border-left: 4px solid #8b5cf6;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="font-size: 24px; margin-right: 12px;">📦</span>
                    <div>
                      <strong style="color: #5b21b6; font-size: 14px;">Easy Order Tracking</strong>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Track your orders in real-time from your dashboard</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 16px 20px; border-radius: 10px; border-left: 4px solid #ec4899;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="font-size: 24px; margin-right: 12px;">❤️</span>
                    <div>
                      <strong style="color: #9d174d; font-size: 14px;">Personalized Wishlist</strong>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Save favorites and get price drop alerts</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 16px 20px; border-radius: 10px; border-left: 4px solid #06b6d4;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="font-size: 24px; margin-right: 12px;">🛡️</span>
                    <div>
                      <strong style="color: #0e7490; font-size: 14px;">Warranty Protection</strong>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">All products come with official warranty</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Popular Categories -->
              <h3 style="color: #2563eb; font-size: 16px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">🛒 Explore Our Categories</h3>
              
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0;">
                <span style="display: inline-block; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 10px 18px; border-radius: 25px; font-size: 13px; color: #1e40af; font-weight: 500;">📺 LED TVs</span>
                <span style="display: inline-block; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 10px 18px; border-radius: 25px; font-size: 13px; color: #166534; font-weight: 500;">❄️ AC & Cooling</span>
                <span style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 10px 18px; border-radius: 25px; font-size: 13px; color: #92400e; font-weight: 500;">🧺 Washing Machines</span>
                <span style="display: inline-block; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 10px 18px; border-radius: 25px; font-size: 13px; color: #9d174d; font-weight: 500;">🍳 Kitchen Appliances</span>
                <span style="display: inline-block; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 10px 18px; border-radius: 25px; font-size: 13px; color: #4338ca; font-weight: 500;">🔌 Small Appliances</span>
              </div>
              
              <!-- Pro Tip -->
              <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 1px solid #a7f3d0;">
                <h4 style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">💡 Pro Tip</h4>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">Complete your profile to unlock personalized recommendations and enjoy faster checkout on your next order!</p>
              </div>
              
              <!-- Contact -->
              <div style="margin-top: 32px; text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; font-weight: 600;">Need Help Getting Started?</p>
                <p style="margin: 0;">
                  <a href="tel:0300-4649141" style="color: #2563eb; font-weight: 600; font-size: 18px; text-decoration: none;">📞 0300-4649141</a>
                </p>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">Available Mon-Sat, 10 AM - 8 PM</p>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">📍 Visit our store: Shop # 30 Saleem Complex, Q Block (Ext), Model Town, Lahore</p>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 24px; background: #1e40af;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">World Spilt Centre</p>
              <p style="margin: 0 0 4px 0; color: #93c5fd; font-size: 13px;">Pakistan's Trusted Electronics Store</p>
              <p style="margin: 16px 0 0 0; color: #60a5fa; font-size: 11px;">© ${new Date().getFullYear()} World Spilt Centre. All rights reserved.</p>
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
    console.log("Welcome email sent successfully:", data);

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
