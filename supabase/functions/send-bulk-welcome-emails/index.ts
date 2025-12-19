import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client to access auth.users
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    // Get all users from auth.users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users.length} users to send welcome emails to`);

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send welcome email to each user
    for (const authUser of users) {
      try {
        const displayName = authUser.user_metadata?.full_name || "Valued Customer";
        
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "World Spilt Centre <support@worldspiltcentre.com>",
            to: [authUser.email],
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
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You're part of the World Spilt Centre family</p>
                </div>
                
                <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 18px;">Dear <strong>${displayName}</strong>,</p>
                  
                  <p>Thank you for being a member of World Spilt Centre! We're thrilled to have you in our community of smart shoppers.</p>
                  
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
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://worldspiltcentre.com/products" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Start Shopping →
                    </a>
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

        if (res.ok) {
          sentCount++;
          console.log(`Welcome email sent to: ${authUser.email}`);
        } else {
          const errorText = await res.text();
          failedCount++;
          errors.push(`${authUser.email}: ${errorText}`);
          console.error(`Failed to send to ${authUser.email}:`, errorText);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError: any) {
        failedCount++;
        errors.push(`${authUser.email}: ${emailError.message}`);
        console.error(`Error sending to ${authUser.email}:`, emailError);
      }
    }

    console.log(`Bulk welcome emails complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: users.length,
        errors: errors.slice(0, 10) // Only return first 10 errors
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in bulk welcome emails:", error);
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
