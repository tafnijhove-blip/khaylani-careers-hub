import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  naam: string;
  email: string;
  telefoon: string | null;
  company_id: string | null;
  user_roles?: Array<{ role: string }>;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const EditUserDialog = ({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    telefoon: "",
    role: "recruiter",
    company_id: "",
  });

  const { data: bedrijven } = useQuery({
    queryKey: ["bedrijven-detacheringbureaus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bedrijven")
        .select("*")
        .eq("type", "detacheringbureau")
        .order("naam");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        naam: user.naam || "",
        telefoon: user.telefoon || "",
        role: user.user_roles?.[0]?.role || "recruiter",
        company_id: user.company_id || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          naam: formData.naam,
          telefoon: formData.telefoon || null,
          company_id: formData.company_id || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role using secure RPC
      const { error: roleError } = await supabase
        .rpc("manage_user_role", {
          target_user_id: user.id,
          new_role: formData.role as any
        });
      if (roleError) throw roleError;

      toast({
        title: "Gebruiker bijgewerkt",
        description: `${formData.naam} is succesvol bijgewerkt. De gebruiker moet uitloggen en opnieuw inloggen om de nieuwe rol te activeren.`,
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

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gebruiker Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de gegevens van {user.naam}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="naam">Naam *</Label>
            <Input
              id="naam"
              value={formData.naam}
              onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email kan niet worden gewijzigd</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefoon">Telefoon</Label>
            <Input
              id="telefoon"
              value={formData.telefoon}
              onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="ceo">Manager</SelectItem>
                <SelectItem value="accountmanager">Account Manager</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Bedrijf</Label>
            <Select
              value={formData.company_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, company_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer bedrijf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen bedrijf</SelectItem>
                {bedrijven?.map((bedrijf) => (
                  <SelectItem key={bedrijf.id} value={bedrijf.id}>
                    {bedrijf.naam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default EditUserDialog;
