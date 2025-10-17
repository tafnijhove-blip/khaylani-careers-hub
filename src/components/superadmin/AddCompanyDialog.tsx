import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { companySchema, type CompanyFormData } from "@/lib/validationSchemas";
import { z } from "zod";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "detacheringbureau" | "klant";
  onSuccess: () => void;
}

const AddCompanyDialog = ({ open, onOpenChange, type, onSuccess }: AddCompanyDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [formData, setFormData] = useState<CompanyFormData>({
    naam: "",
    adres: "",
    plaats: "",
    regio: "",
    email: "",
    telefoon: "",
    contactpersoon: "",
    opmerkingen: "",
    beloning: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form data
      const validated = companySchema.parse(formData);

      // Get current user's profile to link the customer company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      // Try to geocode the address if available
      let coordinates: { lat: number; lng: number } | null = null;
      if (validated.adres || validated.plaats) {
        try {
          const addressToGeocode = validated.adres 
            ? `${validated.adres}, ${validated.plaats || ''}, Nederland` 
            : `${validated.plaats}, Nederland`;
          
          const { data: geocodeData } = await supabase.functions.invoke('geocode-address', {
            body: { address: addressToGeocode }
          });
          
          if (geocodeData?.lat && geocodeData?.lng) {
            coordinates = { lat: geocodeData.lat, lng: geocodeData.lng };
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed:', geocodeError);
          // Continue without coordinates
        }
      }

      // Insert the company
      const { data: newCompany, error: companyError } = await supabase.from("bedrijven").insert({
        ...validated,
        type,
        created_by: user.id,
        ...(coordinates && { lat: coordinates.lat, lng: coordinates.lng })
      }).select().single();

      if (companyError) throw companyError;

      // If this is a customer company and user has a company_id, create the relationship
      if (type === "klant" && userProfile?.company_id && newCompany) {
        const { error: relationError } = await supabase.from("bedrijf_relaties").insert({
          detacheringbureau_id: userProfile.company_id,
          klant_id: newCompany.id,
          created_by: user.id,
        });

        if (relationError) {
          console.error("Failed to create relationship:", relationError);
          // Don't fail the whole operation if relationship creation fails
        }
      }

      toast({
        title: "Bedrijf toegevoegd",
        description: `${formData.naam} is succesvol toegevoegd`,
      });

      setFormData({
        naam: "",
        adres: "",
        plaats: "",
        regio: "",
        email: "",
        telefoon: "",
        contactpersoon: "",
        opmerkingen: "",
        beloning: "",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CompanyFormData, string>> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof CompanyFormData] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validatiefout",
          description: "Controleer de ingevoerde gegevens",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fout bij toevoegen",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nieuw {type === "detacheringbureau" ? "Detacheringbureau" : "Klantbedrijf"} Toevoegen
          </DialogTitle>
          <DialogDescription>
            Voeg de gegevens van het nieuwe bedrijf in
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Bedrijfsnaam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                required
              />
              {errors.naam && <p className="text-sm text-destructive">{errors.naam}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactpersoon">Contactpersoon</Label>
              <Input
                id="contactpersoon"
                value={formData.contactpersoon}
                onChange={(e) => setFormData({ ...formData, contactpersoon: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoon">Telefoon</Label>
              <Input
                id="telefoon"
                value={formData.telefoon}
                onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
                placeholder="+31612345678"
              />
              {errors.telefoon && <p className="text-sm text-destructive">{errors.telefoon}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres">Adres</Label>
            <Input
              id="adres"
              value={formData.adres}
              onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plaats">Plaats</Label>
              <Input
                id="plaats"
                value={formData.plaats}
                onChange={(e) => setFormData({ ...formData, plaats: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regio">Regio *</Label>
              <Input
                id="regio"
                value={formData.regio}
                onChange={(e) => setFormData({ ...formData, regio: e.target.value })}
                required
              />
              {errors.regio && <p className="text-sm text-destructive">{errors.regio}</p>}
            </div>
          </div>

          {type === "detacheringbureau" && (
            <div className="space-y-2">
              <Label htmlFor="beloning">Beloning/Provisie</Label>
              <Input
                id="beloning"
                value={formData.beloning}
                onChange={(e) => setFormData({ ...formData, beloning: e.target.value })}
                placeholder="Bijv. 15% van jaarsalaris"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="opmerkingen">Opmerkingen</Label>
            <Textarea
              id="opmerkingen"
              value={formData.opmerkingen}
              onChange={(e) => setFormData({ ...formData, opmerkingen: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Toevoegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
