// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

type SwapRequest = {
  itemId?: string;
  price?: number;
  wallet?: string;
};

serve(async (req) => {
  try {
    const body: SwapRequest = await req.json();
    console.log("[wiz-swap] Incoming request", {
      body,
      headers: Object.fromEntries(req.headers),
    });

    const mintAddress = Deno.env.get("wiz_coin");
    const heliusRpc = Deno.env.get("HELIUS_RPC") || "";

    if (!mintAddress) {
      console.error("[wiz-swap] Missing wiz_coin environment variable");
      return new Response(
        JSON.stringify({ error: "Missing wiz_coin environment variable." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!body.wallet || !body.itemId || typeof body.price !== "number") {
      console.error("[wiz-swap] Invalid payload", body);
      return new Response(
        JSON.stringify({ error: "Invalid payload." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // This is a placeholder payload to be used by the client/Phantom for swapping.
    // Hook in your preferred swap provider (e.g., Helius swap or Jupiter) here.
    const response = {
      message: "Swap intent created. Use Phantom to complete.",
      mintAddress,
      heliusRpc,
      wallet: body.wallet,
      itemId: body.itemId,
      amount: body.price,
    };

    console.log("[wiz-swap] Responding with swap intent", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[wiz-swap] Unexpected error", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
