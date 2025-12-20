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

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep } = await req.json();

    if (!cep) {
      return new Response(
        JSON.stringify({ error: 'CEP é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove non-numeric characters from CEP
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido. Deve conter 8 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up CEP:', cleanCep);

    // Call ViaCEP API with proper headers
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Lovable/1.0',
      },
    });

    console.log('ViaCEP response status:', response.status);

    // Check if response is OK
    if (!response.ok) {
      console.error('ViaCEP returned non-OK status:', response.status);
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar serviço de CEP' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get response as text first to check if it's valid JSON
    const responseText = await response.text();
    console.log('ViaCEP response text:', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse ViaCEP response as JSON:', responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do serviço de CEP' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.erro) {
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Internal error looking up CEP:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar CEP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
