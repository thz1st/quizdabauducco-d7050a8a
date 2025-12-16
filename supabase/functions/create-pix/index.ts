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
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
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
      neighborhood,
      city,
      state,
      zipCode
    }: PixRequest = await req.json();

    console.log('Creating PIX payment with NitroPay:', { amount, customerName, customerEmail, orderId });

    const apiToken = Deno.env.get('NITROPAY_API_TOKEN');

    if (!apiToken) {
      throw new Error('NitroPay API token not configured');
    }

    const payload = {
      amount: Math.round(amount * 100), // Convert to cents
      payment_method: 'pix',
      customer: {
        name: customerName,
        email: customerEmail,
        phone_number: customerPhone?.replace(/\D/g, '') || '',
        document: customerDocument.replace(/\D/g, ''),
        street_name: street || 'N/A',
        number: number || 'S/N',
        complement: '',
        neighborhood: neighborhood || 'N/A',
        city: city || 'N/A',
        state: state || 'SP',
        zip_code: zipCode?.replace(/\D/g, '') || '00000000'
      },
      cart: [
        {
          product_hash: orderId,
          title: 'Pedido Bauducco',
          cover: null,
          price: Math.round(amount * 100),
          quantity: 1,
          operation_type: 1,
          tangible: true
        }
      ],
      expire_in_days: 1
    };

    console.log('Sending request to NitroPay:', JSON.stringify(payload));

    const response = await fetch(`https://api.nitropagamentos.com/api/public/v1/transactions?api_token=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response from NitroPay:', JSON.stringify(data));

    if (!response.ok) {
      console.error('NitroPay error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create PIX payment', 
          details: data
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract PIX data from NitroPay response
    const pixCode = data.pix?.qrcode || data.pix?.code || data.qrcode || data.pix_qrcode;
    const pixQrCode = data.pix?.qrcode_image || data.pix?.qr_code_base64 || data.qrcode_image;

    return new Response(
      JSON.stringify({
        success: true,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        transactionId: data.id || data.transaction_id,
        expiresAt: data.expires_at || data.pix?.expires_at,
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
