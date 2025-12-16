import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      throw new Error('EvolutPay API keys not configured');
    }

    console.log('Fetching producer balance from EvolutPay');

    const response = await fetch('https://app.evolutpay.com/api/v1/gateway/producer/balance', {
      method: 'GET',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
      },
    });

    const data = await response.json();
    console.log('EvolutPay balance response:', JSON.stringify(data));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to fetch balance', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        available: data.available,
        pending: data.pending,
        fundLock: data.fundLock,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
