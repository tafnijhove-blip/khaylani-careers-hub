import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Loader2, UserCheck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getKandidaatStatusClass, getKandidaatStatusLabel } from "@/lib/statusUtils";
import { usePermissions } from "@/hooks/usePermissions";

interface Vacature {
  id: string;
  functietitel: string;
  aantal_posities: number;
  bedrijf_id: string;
  bedrijven: {
    naam: string;
  };
}

interface Kandidaat {
  id: string;
  naam: string;
  email: string | null;
  telefoon: string | null;
  status: string;
  startdatum: string | null;
  opmerkingen: string | null;
  vacature_id: string;
  vacatures: {
    functietitel: string;
    bedrijven: {
      naam: string;
    };
  };
}

const Kandidaten = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(false);
  const [kandidaten, setKandidaten] = useState<Kandidaat[]>([]);
  const [vacatures, setVacatures] = useState<Vacature[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [selectedVacatureId, setSelectedVacatureId] = useState("");
  const [status, setStatus] = useState("geplaatst");
  const [startdatum, setStartdatum] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kandidatenRes, vacaturesRes] = await Promise.all([
        supabase
          .from("kandidaten")
          .select(`
            *,
            vacatures (
              functietitel,
              bedrijven (naam)
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("vacatures")
          .select(`
            id,
            functietitel,
            aantal_posities,
            bedrijf_id,
            bedrijven (naam)
          `)
          .eq("status", "open")
          .order("functietitel"),
      ]);

      if (kandidatenRes.error) throw kandidatenRes.error;
      if (vacaturesRes.error) throw vacaturesRes.error;

      setKandidaten(kandidatenRes.data || []);
      setVacatures(vacaturesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Fout bij laden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNaam("");
    setEmail("");
    setTelefoon("");
    setSelectedVacatureId("");
    setStatus("geplaatst");
    setStartdatum("");
    setOpmerkingen("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      if (!naam || !selectedVacatureId) {
        throw new Error("Naam en vacature zijn verplicht");
      }

      const { error } = await supabase.from("kandidaten").insert({
        naam,
        email: email || null,
        telefoon: telefoon || null,
        vacature_id: selectedVacatureId,
        status,
        startdatum: startdatum || null,
        opmerkingen: opmerkingen || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Kandidaat toegevoegd!",
        description: `${naam} is succesvol geplaatst`,
      });

      resetForm();
      setIsDialogOpen(false);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const kandidatenStats = useMemo(() => ({
    total: kandidaten.length,
    geplaatst: kandidaten.filter((k) => k.status === "geplaatst").length,
    gestart: kandidaten.filter((k) => k.status === "gestart").length,
    afgerond: kandidaten.filter((k) => k.status === "afgerond").length,
  }), [kandidaten]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Kandidatenbeheer</h1>
            <p className="text-muted-foreground">
              {permissions.canCreateCandidates 
                ? "Beheer geplaatste kandidaten en hun status" 
                : "Bekijk geplaatste kandidaten"}
            </p>
          </div>
          {permissions.canCreateCandidates && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Kandidaat Plaatsen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Nieuwe Kandidaat Plaatsen
                  </DialogTitle>
                  <DialogDescription>
                    Vul de gegevens in van de kandidaat die je wilt plaatsen
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="naam">Naam *</Label>
                    <Input
                      id="naam"
                      value={naam}
                      onChange={(e) => setNaam(e.target.value)}
                      required
                      placeholder="Bijv. Jan Jansen"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jan@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoon">Telefoon</Label>
                      <Input
                        id="telefoon"
                        value={telefoon}
                        onChange={(e) => setTelefoon(e.target.value)}
                        placeholder="06-12345678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vacature">Vacature *</Label>
                    <Select value={selectedVacatureId} onValueChange={setSelectedVacatureId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een vacature" />
                      </SelectTrigger>
                      <SelectContent>
                        {vacatures.map((vacature) => (
                          <SelectItem key={vacature.id} value={vacature.id}>
                            {vacature.functietitel} - {vacature.bedrijven.naam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geplaatst">Geplaatst</SelectItem>
                          <SelectItem value="gestart">Gestart</SelectItem>
                          <SelectItem value="afgerond">Afgerond</SelectItem>
                          <SelectItem value="gestopt">Gestopt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startdatum">Startdatum</Label>
                      <Input
                        id="startdatum"
                        type="date"
                        value={startdatum}
                        onChange={(e) => setStartdatum(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opmerkingen">Opmerkingen</Label>
                    <Textarea
                      id="opmerkingen"
                      value={opmerkingen}
                      onChange={(e) => setOpmerkingen(e.target.value)}
                      placeholder="Extra informatie over de plaatsing"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kandidaat Plaatsen
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Kandidaten</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{kandidatenStats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Geplaatst</CardTitle>
              <UserCheck className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {kandidatenStats.geplaatst}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gestart</CardTitle>
              <Calendar className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {kandidatenStats.gestart}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Afgerond</CardTitle>
              <UserCheck className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {kandidatenStats.afgerond}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kandidaten List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Kandidaten Overzicht</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message="Kandidaten laden..." />
            </div>
          ) : kandidaten.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Nog geen kandidaten geplaatst</p>
                <p className="text-sm text-muted-foreground mb-4">Begin met het plaatsen van je eerste kandidaat</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kandidaten.map((kandidaat) => (
                <Card
                  key={kandidaat.id}
                  className="border-2 hover:shadow-xl hover:border-primary/50 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{kandidaat.naam}</CardTitle>
                        <CardDescription className="mt-1">
                          {kandidaat.vacatures.functietitel}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {kandidaat.vacatures.bedrijven.naam}
                        </p>
                      </div>
                      <Badge className={getKandidaatStatusClass(kandidaat.status)} variant="outline">
                        {getKandidaatStatusLabel(kandidaat.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {kandidaat.email && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Email:</span> {kandidaat.email}
                        </p>
                      )}
                      {kandidaat.telefoon && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Telefoon:</span> {kandidaat.telefoon}
                        </p>
                      )}
                      {kandidaat.startdatum && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Start:</span>{" "}
                          {new Date(kandidaat.startdatum).toLocaleDateString("nl-NL")}
                        </p>
                      )}
                      {kandidaat.opmerkingen && (
                        <p className="text-muted-foreground mt-2 pt-2 border-t">
                          <span className="font-medium">Opmerkingen:</span>
                          <br />
                          {kandidaat.opmerkingen}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Kandidaten;