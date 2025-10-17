import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!mapboxToken) {
      throw new Error('Mapbox token niet geconfigureerd');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all companies without coordinates
    const { data: companies, error: fetchError } = await supabase
      .from('bedrijven')
      .select('id, naam, adres, plaats')
      .or('lat.is.null,lng.is.null');

    if (fetchError) throw fetchError;

    console.log(`Found ${companies?.length || 0} companies without coordinates`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const company of companies || []) {
      try {
        // Skip if no address info available
        if (!company.adres && !company.plaats) {
          console.log(`Skipping ${company.naam}: no address or city`);
          failCount++;
          results.push({
            id: company.id,
            naam: company.naam,
            success: false,
            reason: 'Geen adres of plaats beschikbaar'
          });
          continue;
        }

        const addressToGeocode = company.adres 
          ? `${company.adres}, ${company.plaats || ''}, Nederland` 
          : `${company.plaats}, Nederland`;

        console.log(`Geocoding ${company.naam}: ${addressToGeocode}`);

        // Geocode using Mapbox API
        const encodedAddress = encodeURIComponent(addressToGeocode);
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=NL&limit=1`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
          console.log(`No location found for ${company.naam}`);
          failCount++;
          results.push({
            id: company.id,
            naam: company.naam,
            success: false,
            reason: 'Geen locatie gevonden'
          });
          continue;
        }

        const [lng, lat] = data.features[0].center;
        
        // Update the company with coordinates
        const { error: updateError } = await supabase
          .from('bedrijven')
          .update({ lat, lng })
          .eq('id', company.id);

        if (updateError) throw updateError;

        console.log(`✓ Updated ${company.naam} with coordinates: ${lat}, ${lng}`);
        successCount++;
        results.push({
          id: company.id,
          naam: company.naam,
          success: true,
          lat,
          lng
        });

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error geocoding ${company.naam}:`, error);
        failCount++;
        results.push({
          id: company.id,
          naam: company.naam,
          success: false,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Geocoding complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Geocoding voltooid: ${successCount} succesvol, ${failCount} mislukt`,
        successCount,
        failCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
