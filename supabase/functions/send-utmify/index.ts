import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UtmifyPayload {
  orderId: string;
  platform: string;
  paymentMethod: 'pix' | 'credit_card' | 'boleto' | 'paypal' | 'free_price';
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId: string | null;
    planName: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src: string | null;
    sck: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    utm_content: string | null;
    utm_term: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CAD' | 'COP' | 'MXN' | 'PYG' | 'CLP' | 'PEN' | 'PLN';
  };
  isTest?: boolean;
}

// Helper to format date to UTC string YYYY-MM-DD HH:MM:SS
function formatDateUTC(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const utmifyToken = Deno.env.get('UTMIFY_API_TOKEN');
    
    if (!utmifyToken) {
      console.error('UTMIFY_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Utmify not configured', success: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: UtmifyPayload = await req.json();
    
    console.log('Sending to Utmify:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': utmifyToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log('Utmify response status:', response.status);
    console.log('Utmify response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Utmify API error:', response.status, data);
      return new Response(
        JSON.stringify({ error: 'Utmify API error', details: data, success: false }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending to Utmify:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
