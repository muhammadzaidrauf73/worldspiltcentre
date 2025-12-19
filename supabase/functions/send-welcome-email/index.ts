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

    // Transactional email - simple and professional to land in Primary inbox
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [email],
        subject: "Your World Spilt Centre Account is Ready",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            
            <div style="border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px;">
              <h2 style="color: #1e40af; margin: 0; font-size: 20px;">World Spilt Centre</h2>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 13px;">Premium Electronics & Home Appliances</p>
            </div>
            
            <p style="font-size: 15px; margin-bottom: 20px;">Dear ${displayName},</p>
            
            <p style="color: #333333; font-size: 15px; margin-bottom: 20px;">
              Thank you for creating your account with World Spilt Centre. Your registration is now complete and you can start shopping.
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #1e40af;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #333333;">With your account, you can:</p>
              <ul style="margin: 0; padding-left: 20px; color: #555555;">
                <li style="margin-bottom: 8px;">Track your orders in real-time</li>
                <li style="margin-bottom: 8px;">Save items to your wishlist</li>
                <li style="margin-bottom: 8px;">Access your order history</li>
                <li style="margin-bottom: 8px;">Faster checkout with saved details</li>
              </ul>
            </div>
            
            <p style="color: #333333; font-size: 15px; margin-bottom: 25px;">
              If you did not create this account, please contact us immediately at support@worldspiltcentre.com
            </p>
            
            <div style="border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>Need assistance?</strong></p>
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
