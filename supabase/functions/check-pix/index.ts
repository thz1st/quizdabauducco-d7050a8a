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

// Send event to Utmify - AWAITED to ensure it completes
async function sendToUtmify(payload: Record<string, unknown>): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const utmifyToken = Deno.env.get('UTMIFY_API_TOKEN');
    if (!utmifyToken) {
      console.error('[UTMIFY] UTMIFY_API_TOKEN not configured, skipping tracking');
      return { success: false, error: 'UTMIFY_API_TOKEN not configured' };
    }

    console.log('[UTMIFY] Sending paid status to Utmify...');
    console.log('[UTMIFY] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': utmifyToken,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[UTMIFY] Response status:', response.status);
    console.log('[UTMIFY] Response body:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      console.error('[UTMIFY] Error response:', response.status, data);
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }

    console.log('[UTMIFY] Successfully sent paid status to Utmify');
    return { success: true, response: data };
  } catch (error) {
    console.error('[UTMIFY] Exception sending to Utmify:', error);
    return { success: false, error: String(error) };
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

    console.log('[CHECK-PIX] ========================================');
    console.log('[CHECK-PIX] Checking payment status for transaction:', transactionId);
    console.log('[CHECK-PIX] Order ID:', orderId);
    console.log('[CHECK-PIX] UTM params:', { src, sck, utm_source, utm_campaign, utm_medium, utm_content, utm_term });

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'ID da transação é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('[CHECK-PIX] Payment gateway not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de pagamento indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // API endpoint with /info/ path as per documentation
    const apiUrl = `https://api.evolutpay.com.br/v1/payment-transaction/info/${transactionId}`;
    console.log('[CHECK-PIX] Calling EvolutPay API:', apiUrl);

    // Auth (EvolutPay expects Basic Auth, same as create-pix)
    const credentials = btoa(`${publicKey}:${secretKey}`);
    console.log('[CHECK-PIX] Using Basic Auth with public key:', publicKey?.substring(0, 8) + '...');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
    });

    console.log('[CHECK-PIX] EvolutPay response status:', response.status);

    // Get response as text first to handle empty or invalid JSON
    const responseText = await response.text();
    console.log('[CHECK-PIX] EvolutPay raw response:', responseText.substring(0, 500));

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[CHECK-PIX] Failed to parse EvolutPay response:', parseError);
      // If response is not JSON, try to extract meaningful info
      data = { rawResponse: responseText, parseError: true };
    }

    console.log('[CHECK-PIX] EvolutPay parsed data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[CHECK-PIX] Payment check failed:', response.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível verificar o pagamento',
          status: 'pending',
          isPaid: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // EvolutPay returns response as object: { data: { id, status, ... }, success: true }
    // NOT an array - extract directly
    const tx = data?.data ?? data;
    
    console.log('[CHECK-PIX] Extracted transaction:', JSON.stringify(tx, null, 2));
    
    // Check for payment status
    const rawStatus = tx?.status || '';
    const status = String(rawStatus).toUpperCase().trim();
    
    console.log('[CHECK-PIX] Payment status from API:', rawStatus, '-> normalized:', status);
    
    // EvolutPay returns uppercase status: PAID, PENDING, REFUNDED, FAILED, REFUSED, CHARGEBACK, PRECHARGEBACK, EXPIRED, ERROR
    const PAID_STATUSES = ['PAID'];
    const isPaid = PAID_STATUSES.includes(status);
    
    console.log('[CHECK-PIX] Is payment confirmed?', isPaid);

    // If payment is confirmed and we have order data, send to Utmify
    if (isPaid && orderId) {
      console.log('[CHECK-PIX] Payment confirmed! Preparing to send to Utmify...');
      
      const approvedDate = formatDateUTC(new Date());
      const amountInCents = Math.round((totalAmount || 0) * 100);
      const gatewayFeeInCents = Math.round(amountInCents * 0.03);
      const userCommissionInCents = amountInCents - gatewayFeeInCents;

      // Build Utmify products array
      const utmifyProducts = products && products.length > 0
        ? products.map(p => ({
            id: String(p.id),
            name: String(p.name),
            planId: null,
            planName: null,
            quantity: Number(p.quantity),
            priceInCents: Math.round(Number(p.price) * 100),
          }))
        : [{
            id: String(orderId),
            name: "Pedido Bauducco",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amountInCents,
          }];

      const utmifyPayload = {
        orderId: String(orderId),
        platform: "Bauducco",
        paymentMethod: "pix" as const,
        status: "paid" as const,
        createdAt: createdAt || approvedDate,
        approvedDate: approvedDate,
        refundedAt: null,
        customer: {
          name: String(customerName || '').trim(),
          email: String(customerEmail || '').trim(),
          phone: customerPhone ? String(customerPhone) : null,
          document: customerDocument ? String(customerDocument) : null,
          country: "BR",
        },
        products: utmifyProducts,
        trackingParameters: {
          src: src ? String(src) : null,
          sck: sck ? String(sck) : null,
          utm_source: utm_source ? String(utm_source) : null,
          utm_campaign: utm_campaign ? String(utm_campaign) : null,
          utm_medium: utm_medium ? String(utm_medium) : null,
          utm_content: utm_content ? String(utm_content) : null,
          utm_term: utm_term ? String(utm_term) : null,
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: gatewayFeeInCents,
          userCommissionInCents: userCommissionInCents,
          // Não enviar currency quando for BRL (conforme documentação Utmify)
        },
        isTest: false,
      };

      console.log('[CHECK-PIX] Utmify payload prepared:', JSON.stringify(utmifyPayload, null, 2));
      
      // Send to Utmify and wait for response (don't use fire-and-forget for critical tracking)
      const utmifyResult = await sendToUtmify(utmifyPayload);
      console.log('[CHECK-PIX] ========================================');
      console.log('[CHECK-PIX] Utmify send result - Success:', utmifyResult.success);
      console.log('[CHECK-PIX] Utmify send result - Response:', JSON.stringify(utmifyResult.response, null, 2));
      if (utmifyResult.error) {
        console.error('[CHECK-PIX] Utmify send ERROR:', utmifyResult.error);
      }
      console.log('[CHECK-PIX] ========================================');
    } else if (isPaid && !orderId) {
      console.warn('[CHECK-PIX] Payment is confirmed but orderId is missing - cannot send to Utmify');
    } else {
      console.log('[CHECK-PIX] Payment not yet confirmed, status:', status);
    }

    return new Response(
      JSON.stringify({
        status: tx?.status || data?.status || status,
        paidAt: tx?.paid_at || tx?.payedAt || data?.paid_at || data?.payedAt || null,
        isPaid: isPaid,
        paymentMethod: tx?.payment_method || data?.payment_method || 'pix',
        amount: tx?.amount || data?.amount,
        utmifySent: isPaid && orderId ? true : false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CHECK-PIX] Internal error checking payment:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar pagamento. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
