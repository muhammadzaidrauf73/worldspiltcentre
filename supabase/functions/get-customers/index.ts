import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Get orders to extract customer info as fallback
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("user_id, customer_name, customer_email, customer_phone, shipping_address, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Failed to fetch orders:", ordersError.message);
    }

    // Group orders by user_id to get the most recent order info
    const latestOrderByUser: Record<string, any> = {};
    if (orders) {
      for (const order of orders) {
        if (order.user_id && !latestOrderByUser[order.user_id]) {
          latestOrderByUser[order.user_id] = order;
        }
      }
    }

    // Combine user auth data with profile data and order fallback
    const customers = users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const latestOrder = latestOrderByUser[authUser.id];
      
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || latestOrder?.customer_name || authUser.user_metadata?.full_name || null,
        phone: profile?.phone || latestOrder?.customer_phone || null,
        address: profile?.address || latestOrder?.shipping_address || null,
        avatar_url: profile?.avatar_url || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        // Additional data sources for reference
        profile_phone: profile?.phone || null,
        profile_address: profile?.address || null,
        order_phone: latestOrder?.customer_phone || null,
        order_address: latestOrder?.shipping_address || null,
      };
    });

    console.log(`Fetched ${customers.length} customers with profile and order data`);

    return new Response(JSON.stringify({ success: true, customers }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
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
