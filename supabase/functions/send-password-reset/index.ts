import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const { email, redirectTo }: PasswordResetRequest = await req.json();
    if (!email) throw new Error("Missing required field: email");

    const origin = req.headers.get("origin") ?? "https://worldspiltcentre.com";
    const safeRedirectTo = redirectTo && redirectTo.startsWith(origin)
      ? redirectTo
      : `${origin}/reset-password`;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Generate a proper recovery link (includes token) so we can send our own email.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: safeRedirectTo,
      },
    });

    // Important: never reveal if a user exists.
    if (error) {
      console.error("generateLink error:", error.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const actionLink = (data as any)?.properties?.action_link ?? (data as any)?.action_link;
    if (!actionLink) throw new Error("Could not generate password reset link");

    console.log("Sending custom password reset email to:", email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "World Spilt Centre <support@worldspiltcentre.com>",
        to: [email],
        subject: "Reset Your Password - World Spilt Centre",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We received a request to reset your password</p>
            </div>

            <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">Hello,</p>
              <p>Click the button below to create a new password for your World Spilt Centre account:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Reset My Password
                </a>
              </div>

              <div style="background: #fef3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>This link expires in 1 hour.</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
              </div>

              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${actionLink}" style="color: #f97316; word-break: break-all;">${actionLink}</a>
              </p>

              <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                Need help? Contact us at <a href="tel:0300-4649141" style="color: #f97316; text-decoration: none; font-weight: bold;">0300-4649141</a>
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
      const t = await res.text();
      console.error("Resend API error:", t);
      throw new Error(t);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
