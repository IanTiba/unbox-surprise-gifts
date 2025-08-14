import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe - using the exact secret name from Supabase
    const stripe = new Stripe(Deno.env.get("Stripe Secret Key") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse request body
    const { amount, email, giftBox, cardData } = await req.json();

    // Validate required fields
    if (!amount || !email || !giftBox) {
      throw new Error("Missing required fields: amount, email, or giftBox");
    }

    console.log(`Creating payment session for ${email}, amount: $${amount}`);

    // Check if customer exists
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Digital Gift Box - ${giftBox.title}`,
              description: `${giftBox.cards.length} cards, ${giftBox.theme} theme`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout?canceled=true`,
      metadata: {
        gift_box_title: giftBox.title,
        card_count: giftBox.cards.length.toString(),
        customer_email: email,
      },
    });

    console.log(`Payment session created: ${session.id}`);

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});