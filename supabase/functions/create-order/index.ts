import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      total,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !items || !total) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order using service role (bypasses RLS)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id || null,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        items,
        total,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(
        JSON.stringify({ error: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-deduct stock for catalog items in this order
    try {
      const products = Array.isArray(items?.products) ? items.products : [];
      const stockItems = products
        .filter((p: any) => p?.product_id)
        .map((p: any) => ({
          product_id: p.product_id,
          quantity: Number(p.quantity) || 0,
        }));
      if (stockItems.length > 0) {
        const { error: stockError } = await supabase.rpc("decrement_product_stock", {
          _items: stockItems,
        });
        if (stockError) console.error("Stock decrement error:", stockError);
      }
    } catch (e) {
      console.error("Stock decrement exception:", e);
    }

    return new Response(
      JSON.stringify({ id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
