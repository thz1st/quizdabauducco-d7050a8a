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

    console.log('Creating PIX payment with AbacatePay:', { amount, customerName, customerEmail, orderId });

    const apiToken = Deno.env.get('ABACATEPAY_API_TOKEN');

    if (!apiToken) {
      throw new Error('AbacatePay API token not configured');
    }

    const payload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: orderId,
          name: "Pedido Bauducco",
          description: "Produtos Bauducco",
          quantity: 1,
          price: Math.round(amount * 100), // Convert to cents
        }
      ],
      returnUrl: "https://bauducco.com.br",
      completionUrl: "https://bauducco.com.br/obrigado",
      customer: {
        name: customerName,
        cellphone: customerPhone,
        email: customerEmail,
        taxId: customerDocument,
      },
    };

    console.log('Sending request to AbacatePay:', JSON.stringify(payload));

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response from AbacatePay:', JSON.stringify(data));

    if (!response.ok) {
      console.error('AbacatePay error:', data);
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

    // Extract PIX data from AbacatePay response
    const pixCode = data.data?.pix?.qrcode || data.pix?.qrcode;
    const pixQrCode = data.data?.pix?.qrcodeBase64 || data.pix?.qrcodeBase64;

    return new Response(
      JSON.stringify({
        success: true,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        transactionId: data.data?.id || data.id,
        url: data.data?.url || data.url,
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
