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
    const { transactionId } = await req.json();

    console.log('Checking PIX payment status for:', transactionId);

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      throw new Error('EvolutPay API keys not configured');
    }

    const response = await fetch(`https://app.evolutpay.com/api/v1/gateway/transactions?id=${transactionId}`, {
      method: 'GET',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
      },
    });

    const data = await response.json();
    console.log('EvolutPay check response:', JSON.stringify(data));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to check payment status', details: data }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // EvolutPay status: PENDING, COMPLETED, FAILED, REFUNDED, CHARGED_BACK
    const isPaid = data.status === 'COMPLETED';

    return new Response(
      JSON.stringify({
        status: data.status,
        payedAt: data.payedAt,
        isPaid: isPaid,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        raw: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking PIX:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
