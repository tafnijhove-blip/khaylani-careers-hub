import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Company {
  id: string;
  naam: string;
  adres: string | null;
  plaats: string | null;
  regio: string;
  email: string | null;
  telefoon: string | null;
  contactpersoon: string | null;
  opmerkingen: string | null;
  beloning: string | null;
  type: string;
}

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSuccess: () => void;
}

const EditCompanyDialog = ({ open, onOpenChange, company, onSuccess }: EditCompanyDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (company) {
      setFormData({
        naam: company.naam || "",
        adres: company.adres || "",
        plaats: company.plaats || "",
        regio: company.regio || "",
        email: company.email || "",
        telefoon: company.telefoon || "",
        contactpersoon: company.contactpersoon || "",
        opmerkingen: company.opmerkingen || "",
        beloning: company.beloning || "",
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bedrijven")
        .update(formData)
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Bedrijf bijgewerkt",
        description: `${formData.naam} is succesvol bijgewerkt`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout bij bijwerken",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bedrijf Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de gegevens van {company.naam}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoon">Telefoon</Label>
              <Input
                id="telefoon"
                value={formData.telefoon}
                onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
              />
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
            </div>
          </div>

          {company.type === "detacheringbureau" && (
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
              Opslaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
