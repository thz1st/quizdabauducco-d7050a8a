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

interface PixRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  orderId: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      amount, 
      customerName, 
      customerEmail, 
      customerDocument, 
      customerPhone,
      orderId,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      products,
    }: PixRequest = await req.json();

    console.log('Processing PIX request for order:', orderId);

    // EvolutPay requires minimum R$2.00
    if (amount < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'O valor mínimo para pagamento via PIX é de R$ 2,00',
          code: 'MINIMUM_AMOUNT_ERROR'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

    // Build client object with address
    const clientData: Record<string, unknown> = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      document: customerDocument,
    };

    // Add address only if we have a valid 8-digit zipCode AND a valid UF (2-letter state)
    const cleanZipCode = zipCode ? zipCode.replace(/\D/g, '') : '';
    const formattedZipCode = cleanZipCode.length === 8
      ? `${cleanZipCode.slice(0, 5)}-${cleanZipCode.slice(5)}`
      : '';

    const normalizedState = (state || '').trim().toUpperCase();
    const hasValidUF = /^[A-Z]{2}$/.test(normalizedState);

    // If UF is missing/invalid, omit address entirely to avoid gateway validation errors.
    if (formattedZipCode && hasValidUF) {
      clientData.address = {
        zipCode: formattedZipCode,
        country: 'BR',
        state: normalizedState,
        city: city || '',
        neighborhood: neighborhood || '',
        street: street || '',
        number: number || '',
        complement: complement || '',
      };
    }

    const payload: Record<string, unknown> = {
      identifier: orderId,
      amount: amount,
      client: clientData,
      metadata: {
        source: 'bauducco-loja',
        orderId: orderId,
      },
    };

    // Add products if provided
    if (products && products.length > 0) {
      payload.products = products.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        physical: true,
      }));
    }

    const response = await fetch('https://app.evolutpay.com/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.errorCode) {
      console.error('Payment gateway error:', data.errorCode, data.message, JSON.stringify(data.details || data));
      
      // Map specific errors to user-friendly messages
      let userMessage = 'Erro ao gerar QR Code PIX. Tente novamente.';
      if (data.message?.includes('mínimo')) {
        userMessage = 'O valor mínimo para pagamento via PIX é de R$ 2,00';
      } else if (data.message?.includes('documento') || data.message?.includes('CPF')) {
        userMessage = 'CPF inválido. Verifique os dados informados.';
      } else if (data.details?.some?.((d: { field: string }) => d.field?.includes('state'))) {
        userMessage = 'Estado inválido. Verifique o CEP informado.';
      }
      
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract only necessary PIX data
    const pixCode = data.pix?.code;
    const pixQrCode = data.pix?.base64;
    const pixImage = data.pix?.image;

    return new Response(
      JSON.stringify({
        success: true,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        pixImage: pixImage,
        transactionId: data.transactionId,
        status: data.status,
        orderId: data.order?.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Internal error processing PIX:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar pagamento. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
