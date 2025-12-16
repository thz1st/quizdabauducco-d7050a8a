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
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, customerName, customerEmail, customerDocument, orderId }: PixRequest = await req.json();

    console.log('Creating PIX payment:', { amount, customerName, customerEmail, orderId });

    const secretKey = Deno.env.get('GATEWAY_SECRET_KEY');
    const companyId = Deno.env.get('GATEWAY_COMPANY_ID');
    const globalSecretKey = Deno.env.get('GATEWAY_GLOBAL_SECRET_KEY');
    const globalClientId = Deno.env.get('GATEWAY_GLOBAL_CLIENT_ID');

    if (!secretKey || !companyId) {
      throw new Error('Gateway credentials not configured');
    }

    // Try different endpoint patterns common in Brazilian payment gateways
    const apiBaseUrl = 'https://api.ghostspaysv2.com';
    
    // Attempt 1: Common endpoint pattern
    const payload = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'BRL',
      payment_method: 'pix',
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDocument.replace(/\D/g, ''), // Remove non-digits
      },
      external_id: orderId,
      company_id: companyId,
    };

    console.log('Sending request to GhostsPay:', JSON.stringify(payload));

    // Try with different authentication methods
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
      'X-Secret-Key': secretKey!,
      'X-Company-Id': companyId!,
      'X-Global-Secret-Key': globalSecretKey || '',
      'X-Global-Client-Id': globalClientId || '',
    };

    // Try /pix/create endpoint
    let response = await fetch(`${apiBaseUrl}/pix/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    let data = await response.json();
    console.log('Response from /pix/create:', JSON.stringify(data));

    // If first endpoint fails, try /v1/pix
    if (data.error || !response.ok) {
      console.log('Trying /v1/pix endpoint...');
      response = await fetch(`${apiBaseUrl}/v1/pix`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      data = await response.json();
      console.log('Response from /v1/pix:', JSON.stringify(data));
    }

    // If still fails, try /transactions endpoint
    if (data.error || !response.ok) {
      console.log('Trying /transactions endpoint...');
      response = await fetch(`${apiBaseUrl}/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          type: 'pix',
        }),
      });
      data = await response.json();
      console.log('Response from /transactions:', JSON.stringify(data));
    }

    // If still fails, try /charges endpoint
    if (data.error || !response.ok) {
      console.log('Trying /charges endpoint...');
      response = await fetch(`${apiBaseUrl}/charges`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          payment_method: 'pix',
          customer: {
            name: customerName,
            email: customerEmail,
            tax_id: customerDocument.replace(/\D/g, ''),
          },
          order_id: orderId,
        }),
      });
      data = await response.json();
      console.log('Response from /charges:', JSON.stringify(data));
    }

    if (!response.ok) {
      console.error('All endpoints failed:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create PIX payment', 
          details: data,
          message: 'Por favor, verifique a documentação da API do GhostsPay para os endpoints corretos'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the PIX data
    return new Response(
      JSON.stringify({
        success: true,
        pixCode: data.pix_code || data.qr_code || data.qrcode || data.code || data.pix?.code,
        pixQrCode: data.pix_qr_code || data.qr_code_base64 || data.qrcode_base64 || data.pix?.qr_code,
        transactionId: data.transaction_id || data.id || data.charge_id,
        expiresAt: data.expires_at || data.expiration,
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
