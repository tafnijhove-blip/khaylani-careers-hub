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

    // Clean and format address for better geocoding
    const cleanAddress = address.trim().replace(/\s+/g, ' ');
    const encodedAddress = encodeURIComponent(cleanAddress);
    
    // Use types parameter to focus on addresses
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=NL&types=address,place&limit=1`;
    
    console.log('Geocoding:', cleanAddress);
    console.log('URL:', geocodeUrl.replace(mapboxToken, 'HIDDEN'));
    
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText);
      throw new Error(`Mapbox API fout: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Mapbox response:', JSON.stringify(data, null, 2));
    
    if (!data.features || data.features.length === 0) {
      console.error('Geen resultaten gevonden voor:', cleanAddress);
      throw new Error('Geen locatie gevonden voor dit adres. Controleer of het adres correct is.');
    }

    const [lng, lat] = data.features[0].center;
    const foundPlace = data.features[0].place_name;
    
    console.log('Gevonden:', foundPlace, '-> lat:', lat, 'lng:', lng);

    return new Response(
      JSON.stringify({ lat, lng, place_name: foundPlace }),
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
