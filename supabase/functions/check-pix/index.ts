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

// Helper to format date to UTC string YYYY-MM-DD HH:MM:SS
function formatDateUTC(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

// Send event to Utmify (fire and forget)
async function sendToUtmify(payload: Record<string, unknown>) {
  try {
    const utmifyToken = Deno.env.get('UTMIFY_API_TOKEN');
    if (!utmifyToken) {
      console.log('UTMIFY_API_TOKEN not configured, skipping tracking');
      return;
    }

    console.log('Sending paid status to Utmify:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': utmifyToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Utmify response:', response.status, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error sending to Utmify:', error);
  }
}

interface CheckPixRequest {
  transactionId: string;
  // Order data needed for Utmify update
  orderId?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocument?: string;
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount?: number;
  // UTM parameters
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  src?: string;
  sck?: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      transactionId,
      orderId,
      createdAt,
      customerName,
      customerEmail,
      customerPhone,
      customerDocument,
      products,
      totalAmount,
      utm_source,
      utm_campaign,
      utm_medium,
      utm_content,
      utm_term,
      src,
      sck,
    }: CheckPixRequest = await req.json();

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

    // If payment is confirmed and we have order data, send to Utmify
    if (isPaid && orderId) {
      const approvedDate = formatDateUTC(new Date());
      const amountInCents = Math.round((totalAmount || 0) * 100);
      const gatewayFeeInCents = Math.round(amountInCents * 0.03);
      const userCommissionInCents = amountInCents - gatewayFeeInCents;

      // Build Utmify products array
      const utmifyProducts = products && products.length > 0
        ? products.map(p => ({
            id: p.id,
            name: p.name,
            planId: null,
            planName: null,
            quantity: p.quantity,
            priceInCents: Math.round(p.price * 100),
          }))
        : [{
            id: orderId,
            name: "Pedido Bauducco",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amountInCents,
          }];

      const utmifyPayload = {
        orderId: orderId,
        platform: "Bauducco",
        paymentMethod: "pix" as const,
        status: "paid" as const,
        createdAt: createdAt || approvedDate,
        approvedDate: approvedDate,
        refundedAt: null,
        customer: {
          name: String(customerName || '').trim(),
          email: String(customerEmail || '').trim(),
          phone: customerPhone || null,
          document: customerDocument || null,
          country: "BR",
        },
        products: utmifyProducts,
        trackingParameters: {
          src: src || null,
          sck: sck || null,
          utm_source: utm_source || null,
          utm_campaign: utm_campaign || null,
          utm_medium: utm_medium || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: gatewayFeeInCents,
          userCommissionInCents: userCommissionInCents,
          currency: "BRL",
        },
        isTest: false,
      };

      // Send to Utmify in background (fire and forget)
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      (globalThis as any).EdgeRuntime?.waitUntil?.(sendToUtmify(utmifyPayload)) ?? sendToUtmify(utmifyPayload);
    }

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
