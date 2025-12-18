import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://quizdabauducco.lovable.app',
  'https://id-preview--d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovable.app',
  'https://d4b9c669-4415-4150-aa6c-df5f4a7b5e95.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null) {
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

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[10]) return false;

  return true;
}

// Base64 encode for Basic Auth (Deno compatible)
function btoa(str: string): string {
  return btoa(str);
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

    console.log('Processing PIX request for order:', orderId, 'Amount:', amount);

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

    // Convert amount to cents (integer)
    const amountInCents = Math.round((amount || 0) * 100);

    // Format phone with country code
    const formattedPhone = cleanPhone.length === 11 
      ? `+55${cleanPhone}` 
      : cleanPhone.length === 10 
        ? `+55${cleanPhone}` 
        : `+55${cleanPhone}`;

    // Build customer object for new API
    const customer = {
      name: String(customerName || '').trim().slice(0, 120),
      email: String(customerEmail || '').trim().slice(0, 255),
      document: {
        type: "cpf",
        number: cleanDocument,
      },
      phone: formattedPhone,
    };

    // Build items array from products or create a generic item
    const items = products && products.length > 0
      ? products.map(p => ({
          title: p.name,
          unit_price: Math.round(p.price * 100), // Convert to cents
          quantity: p.quantity,
          tangible: true,
          external_ref: p.id,
        }))
      : [{
          title: "Pedido Bauducco",
          unit_price: amountInCents,
          quantity: 1,
          tangible: true,
          external_ref: orderId,
        }];

    // Build the payload for new EvolutPay API
    const payload = {
      amount: amountInCents,
      payment_method: "pix",
      postback_url: "https://quizdabauducco.lovable.app/webhook", // Required field
      customer: customer,
      items: items,
      pix: {
        expires_in_days: 1,
      },
      metadata: {
        provider_name: "Bauducco Store",
        order_id: orderId,
        source: "bauducco-loja",
      },
    };

    console.log('Sending payload to EvolutPay:', JSON.stringify(payload, null, 2));

    // Create Basic Auth credentials
    const credentials = btoa(`${publicKey}:${secretKey}`);

    const response = await fetch('https://api.evolutpay.com.br/v1/payment-transaction/create', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log('EvolutPay response status:', response.status);
    console.log('EvolutPay response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Payment gateway error:', response.status, JSON.stringify(data));
      
      let userMessage = 'Erro ao gerar QR Code PIX. Tente novamente.';
      
      // Try to extract error message from response
      if (data.message) {
        const msg = String(data.message).toLowerCase();
        if (msg.includes('mínimo') || msg.includes('minimum')) {
          userMessage = 'O valor do pedido está abaixo do mínimo aceito. Adicione mais itens ao carrinho.';
        } else if (msg.includes('documento') || msg.includes('cpf') || msg.includes('document')) {
          userMessage = 'CPF inválido. Verifique os dados informados.';
        } else if (msg.includes('customer')) {
          userMessage = 'Dados do cliente inválidos. Verifique as informações.';
        }
      }
      
      if (data.errors && Array.isArray(data.errors)) {
        console.error('Validation errors:', data.errors);
      }
      
      return new Response(
        JSON.stringify({ error: userMessage, details: data }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract PIX data from response
    // The new API structure may differ - adjust based on actual response
    const pixCode = data.pix?.qr_code || data.pix?.code || data.qr_code || data.code || '';
    const pixQrCode = data.pix?.qr_code_base64 || data.pix?.base64 || data.qr_code_base64 || '';
    const pixImage = data.pix?.qr_code_url || data.pix?.image || data.qr_code_url || '';
    const transactionId = data.id || data.transaction_id || data.transactionId || '';

    console.log('PIX generated successfully. Transaction ID:', transactionId);

    return new Response(
      JSON.stringify({
        success: true,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        pixImage: pixImage,
        transactionId: transactionId,
        status: data.status,
        orderId: orderId,
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
