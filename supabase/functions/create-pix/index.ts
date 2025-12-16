import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Creating PIX QR Code with EvolutPay:', { amount, customerName, customerEmail, orderId });

    const publicKey = Deno.env.get('EVOLUTPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('EVOLUTPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      throw new Error('EvolutPay API keys not configured');
    }

    // Build client object with address
    const clientData: Record<string, unknown> = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      document: customerDocument,
    };

    // Add address only if we have a valid 8-digit zipCode
    const cleanZipCode = zipCode ? zipCode.replace(/\D/g, '') : '';
    
    if (cleanZipCode.length === 8) {
      clientData.address = {
        zipCode: cleanZipCode,
        country: 'BR',
        state: state || 'SP',
        city: city || '',
        neighborhood: neighborhood || '',
        street: street || '',
        number: number || '',
        complement: complement || '',
      };
      console.log('Including address with zipCode:', cleanZipCode);
    } else {
      console.log('Skipping address - invalid zipCode:', cleanZipCode);
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

    console.log('Sending request to EvolutPay:', JSON.stringify(payload));

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
    console.log('Response from EvolutPay:', JSON.stringify(data));

    if (!response.ok || data.errorCode) {
      console.error('EvolutPay error:', data);
      return new Response(
        JSON.stringify({ 
          error: data.message || 'Failed to create PIX QR Code', 
          details: data
        }),
        { 
          status: response.status || 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract PIX data from EvolutPay response
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
        raw: data,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating PIX:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
