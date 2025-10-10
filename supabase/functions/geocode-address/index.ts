import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      throw new Error('Adres is verplicht');
    }

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!mapboxToken) {
      throw new Error('Mapbox token niet geconfigureerd');
    }

    // Geocode using Mapbox API
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=NL&limit=1`;
    
    console.log('Geocoding address:', address);
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('Geen locatie gevonden voor dit adres');
    }

    const [lng, lat] = data.features[0].center;
    
    console.log('Geocoded to:', { lat, lng });

    return new Response(
      JSON.stringify({ lat, lng }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Geocoding error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
