import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";

interface UpdateCompanyCoordinatesProps {
  companyId: string;
  companyName: string;
  address: string;
  city: string;
  onSuccess?: () => void;
}

const UpdateCompanyCoordinates = ({ 
  companyId, 
  companyName, 
  address, 
  city,
  onSuccess 
}: UpdateCompanyCoordinatesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGeocode = async () => {
    setLoading(true);
    
    try {
      const addressToGeocode = `${address}, ${city}, Nederland`;
      
      console.log('Geocoding:', addressToGeocode);
      
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
        body: { address: addressToGeocode }
      });
      
      if (geocodeError) throw geocodeError;
      
      if (!geocodeData?.lat || !geocodeData?.lng) {
        throw new Error('Geen coördinaten gevonden');
      }
      
      // Update the company with coordinates
      const { error: updateError } = await supabase
        .from('bedrijven')
        .update({ 
          lat: geocodeData.lat, 
          lng: geocodeData.lng 
        })
        .eq('id', companyId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Coördinaten toegevoegd",
        description: `${companyName} is nu zichtbaar op de kaart`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Fout bij geocoding",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGeocode} 
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      Voeg locatie toe
    </Button>
  );
};

export default UpdateCompanyCoordinates;
