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
    }: PixRequest = await req.json();

    console.log('Creating PIX QR Code with AbacatePay:', { amount, customerName, customerEmail, orderId });

    // AbacatePay requires minimum of 100 cents (R$1.00)
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Valor mínimo para pagamento PIX é R$1,00',
          details: { minAmount: 1.00, currentAmount: amount }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiToken = Deno.env.get('ABACATEPAY_API_TOKEN');

    if (!apiToken) {
      throw new Error('AbacatePay API token not configured');
    }

    const payload = {
      amount: amountInCents,
      expiresIn: 3600, // 1 hour expiration
      description: `Pedido Bauducco - ${orderId}`,
      customer: {
        name: customerName,
        cellphone: customerPhone,
        email: customerEmail,
        taxId: customerDocument,
      },
      metadata: {
        externalId: orderId,
      },
    };

    console.log('Sending request to AbacatePay:', JSON.stringify(payload));

    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response from AbacatePay:', JSON.stringify(data));

    if (!response.ok || data.error) {
      console.error('AbacatePay error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create PIX QR Code', 
          details: data
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract PIX data from AbacatePay response
    const pixCode = data.data?.brCode;
    const pixQrCode = data.data?.brCodeBase64;

    return new Response(
      JSON.stringify({
        success: true,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        transactionId: data.data?.id,
        expiresAt: data.data?.expiresAt,
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
