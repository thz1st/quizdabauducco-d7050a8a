import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://id-preview--d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovable.app',
  'https://d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('Payment gateway not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching balance');

    const response = await fetch('https://app.evolutpay.com/api/v1/gateway/producer/balance', {
      method: 'GET',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Balance fetch failed:', data.errorCode);
      return new Response(
        JSON.stringify({ error: 'Não foi possível consultar o saldo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    console.error('Internal error fetching balance:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao consultar saldo' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
