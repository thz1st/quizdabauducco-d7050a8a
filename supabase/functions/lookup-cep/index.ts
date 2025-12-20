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

    // Try BrasilAPI first (more reliable)
    let data = null;
    let apiUsed = '';

    // Try BrasilAPI
    try {
      console.log('Trying BrasilAPI...');
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Lovable/1.0',
        },
      });

      console.log('BrasilAPI response status:', brasilApiResponse.status);

      if (brasilApiResponse.ok) {
        const brasilData = await brasilApiResponse.json();
        console.log('BrasilAPI success:', JSON.stringify(brasilData).substring(0, 200));
        
        if (!brasilData.errors) {
          data = {
            logradouro: brasilData.street || '',
            bairro: brasilData.neighborhood || '',
            localidade: brasilData.city || '',
            uf: brasilData.state || '',
          };
          apiUsed = 'BrasilAPI';
        }
      }
    } catch (brasilApiError) {
      console.error('BrasilAPI error:', brasilApiError);
    }

    // Fallback to ViaCEP if BrasilAPI failed
    if (!data) {
      try {
        console.log('Trying ViaCEP as fallback...');
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Lovable/1.0',
          },
        });

        console.log('ViaCEP response status:', viaCepResponse.status);

        if (viaCepResponse.ok) {
          const responseText = await viaCepResponse.text();
          console.log('ViaCEP response text:', responseText.substring(0, 200));

          try {
            const viaCepData = JSON.parse(responseText);
            if (!viaCepData.erro) {
              data = viaCepData;
              apiUsed = 'ViaCEP';
            }
          } catch (parseError) {
            console.error('Failed to parse ViaCEP response:', parseError);
          }
        }
      } catch (viaCepError) {
        console.error('ViaCEP error:', viaCepError);
      }
    }

    // If both APIs failed
    if (!data) {
      console.error('Both CEP APIs failed for CEP:', cleanCep);
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado. Verifique o número e tente novamente.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('CEP found using', apiUsed);

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
