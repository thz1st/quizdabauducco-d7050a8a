import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://quizdabauducco.lovable.app',
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
    const { transactionId } = await req.json();

    console.log('Checking payment status for transaction:', transactionId);

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'ID da transação é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('Payment gateway not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de pagamento indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Basic Auth credentials for new API
    const credentials = btoa(`${publicKey}:${secretKey}`);

    // New API endpoint to get transaction status
    const response = await fetch(`https://api.evolutpay.com.br/v1/payment-transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Check payment response status:', response.status);
    console.log('Check payment response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Payment check failed:', response.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Não foi possível verificar o pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // New API status values may differ - adjust based on actual response
    // Common statuses: pending, paid, canceled, refunded, etc.
    const status = data.status?.toLowerCase() || '';
    const isPaid = status === 'paid' || status === 'completed' || status === 'approved';

    return new Response(
      JSON.stringify({
        status: data.status,
        paidAt: data.paid_at || data.payedAt || null,
        isPaid: isPaid,
        paymentMethod: data.payment_method || 'pix',
        amount: data.amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Internal error checking payment:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar pagamento. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
