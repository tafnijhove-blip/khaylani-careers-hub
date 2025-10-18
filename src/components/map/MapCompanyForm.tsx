import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";

interface MapCompanyFormProps {
  onCompanyAdded: (company: any) => void;
}

const MapCompanyForm = ({ onCompanyAdded }: MapCompanyFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    adres: "",
    plaats: "",
    regio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.naam || !formData.adres || !formData.plaats || !formData.regio) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul minimaal naam, adres, plaats en regio in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      // Get user's company_id
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      // Check if coordinates already exist in cache
      const addressToCheck = `${formData.adres}, ${formData.plaats}, Nederland`.toLowerCase();
      
      const { data: existingCompany } = await supabase
        .from("bedrijven")
        .select("lat, lng")
        .ilike("adres", `%${formData.adres}%`)
        .ilike("plaats", `%${formData.plaats}%`)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(1)
        .single();

      let coordinates: { lat: number; lng: number } | null = null;

      if (existingCompany?.lat && existingCompany?.lng) {
        // Use cached coordinates
        console.log("Using cached coordinates:", existingCompany);
        coordinates = { lat: existingCompany.lat, lng: existingCompany.lng };
      } else {
        // Geocode new address
        const addressToGeocode = `${formData.adres}, ${formData.plaats}, Nederland`;
        console.log("Geocoding new address:", addressToGeocode);

        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
          body: { address: addressToGeocode }
        });

        if (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          throw new Error("Kon adres niet geocoderen. Controleer het adres.");
        }

        if (geocodeData?.lat && geocodeData?.lng) {
          coordinates = { lat: geocodeData.lat, lng: geocodeData.lng };
          console.log("Geocoded successfully:", coordinates);
        } else {
          throw new Error("Geen coördinaten gevonden voor dit adres");
        }
      }

      // Insert company with coordinates
      const { data: newCompany, error: companyError } = await supabase
        .from("bedrijven")
        .insert({
          naam: formData.naam,
          adres: formData.adres,
          plaats: formData.plaats,
          regio: formData.regio,
          type: "klant",
          created_by: user.id,
          lat: coordinates.lat,
          lng: coordinates.lng,
        })
        .select(`
          *,
          vacatures (
            id,
            functietitel,
            status,
            aantal_posities
          )
        `)
        .single();

      if (companyError) throw companyError;

      // Create relationship if user has company_id
      if (userProfile?.company_id && newCompany) {
        const { error: relationError } = await supabase
          .from("bedrijf_relaties")
          .insert({
            detacheringbureau_id: userProfile.company_id,
            klant_id: newCompany.id,
            created_by: user.id,
          });

        if (relationError) {
          console.error("Failed to create relationship:", relationError);
        }
      }

      toast({
        title: "Bedrijf toegevoegd",
        description: `${formData.naam} is succesvol toegevoegd aan de kaart`,
      });

      // Reset form
      setFormData({
        naam: "",
        adres: "",
        plaats: "",
        regio: "",
      });

      // Notify parent component
      onCompanyAdded(newCompany);
    } catch (error: any) {
      console.error("Error adding company:", error);
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er ging iets mis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Nieuw Bedrijf Toevoegen</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="naam">Bedrijfsnaam *</Label>
          <Input
            id="naam"
            value={formData.naam}
            onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
            placeholder="Bijv. TechCorp Amsterdam"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adres">Adres *</Label>
          <Input
            id="adres"
            value={formData.adres}
            onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
            placeholder="Bijv. Hoofdstraat 123"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="plaats">Plaats *</Label>
            <Input
              id="plaats"
              value={formData.plaats}
              onChange={(e) => setFormData({ ...formData, plaats: e.target.value })}
              placeholder="Bijv. Amsterdam"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regio">Regio *</Label>
            <Input
              id="regio"
              value={formData.regio}
              onChange={(e) => setFormData({ ...formData, regio: e.target.value })}
              placeholder="Bijv. Noord-Holland"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Toevoegen aan Kaart
        </Button>
      </form>
    </Card>
  );
};

export default MapCompanyForm;
