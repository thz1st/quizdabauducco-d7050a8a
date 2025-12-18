import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://quizdabauducco.lovable.app',
  'https://id-preview--d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovable.app',
  'https://d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null) {
  // Echo the request origin so the browser can read error responses,
  // but we'll still block non-allowed origins with a 403 below.
  const headerOrigin = origin ?? ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': headerOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

function onlyDigits(value: string) {
  return (value || '').replace(/\D/g, '');
}

function isValidCPF(cpfRaw: string) {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map((c) => Number(c));

  // 1st check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[9]) return false;

  // 2nd check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[10]) return false;

  return true;
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
  const isAllowedOrigin = !!(origin && ALLOWED_ORIGINS.includes(origin));

  console.log('create-pix origin:', origin, 'allowed:', isAllowedOrigin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // If the site is opened from an unapproved domain, return a readable 403 (instead of a CORS-blocked network error).
  if (origin && !isAllowedOrigin) {
    console.warn('Blocked create-pix request from origin:', origin);
    return new Response(
      JSON.stringify({
        error: 'Domínio não autorizado para gerar PIX. Verifique se você está no domínio correto.',
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
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

    const MIN_PIX_AMOUNT = 7.5;

    // Normalize to 2 decimals to avoid floating-point issues (e.g. 7.5 becoming 7.499999999)
    const normalizedAmount = Math.round((amount || 0) * 100) / 100;

    // Payment gateway requires a minimum amount
    if (normalizedAmount + 1e-9 < MIN_PIX_AMOUNT) {
      return new Response(
        JSON.stringify({
          error: `O valor mínimo para pagamento via PIX é de R$ ${MIN_PIX_AMOUNT.toFixed(2).replace('.', ',')}. Adicione mais itens ao carrinho.`,
          code: 'MINIMUM_AMOUNT_ERROR',
          minAmount: MIN_PIX_AMOUNT,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
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

    const cleanDocument = onlyDigits(customerDocument || '');
    const cleanPhone = onlyDigits(customerPhone || '');

    if (!isValidCPF(cleanDocument)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido. Verifique os dados informados.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build client object with normalized values
    const clientData: Record<string, unknown> = {
      name: String(customerName || '').trim().slice(0, 120),
      email: String(customerEmail || '').trim().slice(0, 255),
      phone: cleanPhone,
      document: cleanDocument,
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
      amount: normalizedAmount,
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
      const msg = String(data.message || '').toLowerCase();

      if (msg.includes('mínimo') || msg.includes('minimum') || msg.includes('below the minimum')) {
        userMessage = `O valor mínimo para pagamento via PIX é de R$ ${MIN_PIX_AMOUNT.toFixed(2).replace('.', ',')}. Adicione mais itens ao carrinho.`;
      } else if (msg.includes('documento') || msg.includes('cpf')) {
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
