import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddUserDialog = ({ open, onOpenChange, onSuccess }: AddUserDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    email: "",
    telefoon: "",
    password: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            naam: formData.naam,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Geen gebruiker aangemaakt");

      // Update profile with company and phone
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: formData.company_id || null,
          telefoon: formData.telefoon || null,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Assign role using secure RPC
      const { error: roleError } = await supabase
        .rpc("manage_user_role", {
          target_user_id: authData.user.id,
          new_role: formData.role as any
        });

      if (roleError) throw roleError;

      toast({
        title: "Gebruiker toegevoegd",
        description: `${formData.naam} is succesvol toegevoegd`,
      });

      setFormData({
        naam: "",
        email: "",
        telefoon: "",
        password: "",
        role: "recruiter",
        company_id: "",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout bij toevoegen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nieuwe Gebruiker Toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe gebruiker toe aan het platform
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
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
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
                <SelectValue placeholder="Selecteer bedrijf (optioneel)" />
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
              Toevoegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
