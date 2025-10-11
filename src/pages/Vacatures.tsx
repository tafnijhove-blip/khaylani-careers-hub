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
import { Building2, Plus, Loader2, Trash2, XCircle, Pencil, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getVacatureStatusClass, getPriorityClass, getVacatureStatusLabel, getPriorityLabel } from "@/lib/statusUtils";
import { usePermissions } from "@/hooks/usePermissions";

const regios = ["Noord-Holland", "Zuid-Holland", "Utrecht", "Gelderland", "Noord-Brabant", "Limburg", "Zeeland", "Friesland", "Groningen", "Drenthe", "Overijssel", "Flevoland"];

const Vacatures = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(false);
  const [isNewBedrijf, setIsNewBedrijf] = useState(true);
  const [bestaandeBedrijven, setBestaandeBedrijven] = useState<any[]>([]);
  const [alleVacatures, setAlleVacatures] = useState<any[]>([]);
  const [vereistenInput, setVereistenInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVacature, setEditingVacature] = useState<any>(null);
  const [editVereisten, setEditVereisten] = useState<string[]>([]);
  const [editVereistenInput, setEditVereistenInput] = useState("");
  
  // Bedrijf fields
  const [bedrijfNaam, setBedrijfNaam] = useState("");
  const [regio, setRegio] = useState("");
  const [plaats, setPlaats] = useState("");
  const [adres, setAdres] = useState("");
  const [contactpersoon, setContactpersoon] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [bedrijfBeloning, setBedrijfBeloning] = useState("");
  const [bedrijfOpmerkingen, setBedrijfOpmerkingen] = useState("");
  const [selectedBedrijfId, setSelectedBedrijfId] = useState("");
  
  // Vacature fields
  const [functietitel, setFunctietitel] = useState("");
  const [aantalPosities, setAantalPosities] = useState("1");
  const [status, setStatus] = useState("open");
  const [prioriteit, setPrioriteit] = useState("normaal");
  const [vacatureBeloning, setVacatureBeloning] = useState("");
  const [vacatureOpmerkingen, setVacatureOpmerkingen] = useState("");

  useEffect(() => {
    fetchBedrijven();
    fetchVacatures();
  }, []);

  const fetchBedrijven = async () => {
    const { data, error } = await supabase
      .from("bedrijven")
      .select("*")
      .order("naam");
    
    if (!error && data) {
      setBestaandeBedrijven(data);
    }
  };

  const fetchVacatures = async () => {
    const { data, error } = await supabase
      .from("vacatures")
      .select(`
        *,
        bedrijven (
          naam,
          regio,
          plaats
        )
      `)
      .order("datum_toegevoegd", { ascending: false });
    
    if (!error && data) {
      setAlleVacatures(data);
    }
  };

  // Filter vacatures based on search term
  const filteredVacatures = useMemo(() => {
    if (!searchTerm.trim()) return alleVacatures;
    
    const search = searchTerm.toLowerCase();
    return alleVacatures.filter(v => 
      v.functietitel?.toLowerCase().includes(search) ||
      v.bedrijven?.naam?.toLowerCase().includes(search) ||
      v.bedrijven?.plaats?.toLowerCase().includes(search) ||
      v.bedrijven?.regio?.toLowerCase().includes(search) ||
      v.status?.toLowerCase().includes(search) ||
      v.prioriteit?.toLowerCase().includes(search)
    );
  }, [alleVacatures, searchTerm]);

  const deleteVacature = async (vacatureId: string, functietitel: string) => {
    if (!confirm(`Weet je zeker dat je de vacature "${functietitel}" wilt verwijderen?\n\nLET OP: Alleen de vacature wordt verwijderd, niet het bedrijf.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("vacatures").delete().eq("id", vacatureId);

      if (error) throw error;

      toast({
        title: "✓ Vacature verwijderd",
        description: `${functietitel} is succesvol verwijderd`,
      });

      fetchVacatures();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBedrijf = async (bedrijfId: string, bedrijfNaam: string) => {
    // Count vacatures for this bedrijf
    const vacaturesCount = alleVacatures.filter(v => v.bedrijf_id === bedrijfId).length;
    
    if (vacaturesCount > 0) {
      if (!confirm(`LET OP: Dit bedrijf heeft ${vacaturesCount} actieve vacature(s).\n\nAls je "${bedrijfNaam}" verwijdert, worden ook alle bijbehorende vacatures en kandidaten permanent verwijderd.\n\nWeet je zeker dat je door wilt gaan?`)) {
        return;
      }
    } else {
      if (!confirm(`Weet je zeker dat je bedrijf "${bedrijfNaam}" wilt verwijderen?`)) {
        return;
      }
    }

    try {
      // Get all vacature ids for this bedrijf
      const vacatureIds = alleVacatures
        .filter(v => v.bedrijf_id === bedrijfId)
        .map(v => v.id);

      // First delete all kandidaten for these vacatures
      if (vacatureIds.length > 0) {
        const { error: kandidatenError } = await supabase
          .from("kandidaten")
          .delete()
          .in("vacature_id", vacatureIds);

        if (kandidatenError) throw kandidatenError;
      }

      // Then delete all vacatures
      const { error: vacaturesError } = await supabase
        .from("vacatures")
        .delete()
        .eq("bedrijf_id", bedrijfId);

      if (vacaturesError) throw vacaturesError;

      // Finally delete the bedrijf
      const { error: bedrijfError } = await supabase
        .from("bedrijven")
        .delete()
        .eq("id", bedrijfId);

      if (bedrijfError) throw bedrijfError;

      toast({
        title: "✓ Bedrijf verwijderd",
        description: `${bedrijfNaam} en alle bijbehorende vacatures zijn verwijderd`,
      });

      fetchBedrijven();
      fetchVacatures();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (vacature: any) => {
    setEditingVacature(vacature);
    setEditVereisten(vacature.vereisten || []);
    setEditVereistenInput("");
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingVacature(null);
    setEditVereisten([]);
    setEditVereistenInput("");
  };

  const addEditVereiste = () => {
    const trimmed = editVereistenInput.trim();
    if (trimmed && !editVereisten.includes(trimmed)) {
      setEditVereisten([...editVereisten, trimmed]);
      setEditVereistenInput("");
    }
  };

  const removeEditVereiste = (index: number) => {
    setEditVereisten(editVereisten.filter((_, i) => i !== index));
  };

  const handleEditVereistenKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEditVereiste();
    }
  };

  const handleUpdateVacature = async () => {
    if (!editingVacature) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("vacatures")
        .update({
          functietitel: editingVacature.functietitel,
          vereisten: editVereisten,
          aantal_posities: editingVacature.aantal_posities,
          status: editingVacature.status,
          prioriteit: editingVacature.prioriteit,
          beloning: editingVacature.beloning || null,
          opmerkingen: editingVacature.opmerkingen || null,
        })
        .eq("id", editingVacature.id);

      if (error) throw error;

      toast({
        title: "✓ Vacature bijgewerkt",
        description: `${editingVacature.functietitel} is succesvol bijgewerkt`,
      });

      closeEditDialog();
      fetchVacatures();
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

  const handleVereistenKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addVereiste();
    }
  };

  const [vereisten, setVereisten] = useState<string[]>([]);

  const addVereiste = () => {
    const trimmed = vereistenInput.trim();
    if (trimmed && !vereisten.includes(trimmed)) {
      setVereisten([...vereisten, trimmed]);
      setVereistenInput("");
    }
  };

  const removeVereiste = (index: number) => {
    setVereisten(vereisten.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setBedrijfNaam("");
    setRegio("");
    setPlaats("");
    setAdres("");
    setContactpersoon("");
    setTelefoon("");
    setEmail("");
    setBedrijfBeloning("");
    setBedrijfOpmerkingen("");
    setSelectedBedrijfId("");
    setFunctietitel("");
    setVereisten([]);
    setVereistenInput("");
    setAantalPosities("1");
    setStatus("open");
    setPrioriteit("normaal");
    setVacatureBeloning("");
    setVacatureOpmerkingen("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      let bedrijfId = selectedBedrijfId;

      // Create new bedrijf if needed
      if (isNewBedrijf) {
        if (!bedrijfNaam || !regio) {
          throw new Error("Bedrijfsnaam en regio zijn verplicht");
        }

        // Geocode address if provided
        let lat = null;
        let lng = null;
        if (adres) {
          try {
            const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
              body: { address: adres }
            });
            
            if (!geocodeError && geocodeData) {
              lat = geocodeData.lat;
              lng = geocodeData.lng;
            }
          } catch (err) {
            console.error('Geocoding failed:', err);
            // Continue without coordinates if geocoding fails
          }
        }

        const { data: newBedrijf, error: bedrijfError } = await supabase
          .from("bedrijven")
          .insert({
            naam: bedrijfNaam,
            type: 'klant' as const,
            regio,
            plaats: plaats || null,
            adres: adres || null,
            lat,
            lng,
            contactpersoon: contactpersoon || null,
            telefoon: telefoon || null,
            email: email || null,
            beloning: bedrijfBeloning || null,
            opmerkingen: bedrijfOpmerkingen || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (bedrijfError) throw bedrijfError;
        bedrijfId = newBedrijf.id;

        // Get user's company_id to create relationship
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        // Create relationship between detacheringsbureau and klant
        if (userProfile?.company_id) {
          const { error: relationError } = await supabase
            .from("bedrijf_relaties")
            .insert({
              detacheringbureau_id: userProfile.company_id,
              klant_id: bedrijfId,
              created_by: user.id,
            });

          if (relationError) {
            console.error("Failed to create relationship:", relationError);
            // Don't fail the whole operation if relationship creation fails
          }
        }

        // Log activity
        await supabase.from("activity_log").insert({
          type: "bedrijf_toegevoegd",
          beschrijving: `Bedrijf ${bedrijfNaam} toegevoegd`,
          user_id: user.id,
          related_bedrijf_id: bedrijfId,
        });
      } else {
        if (!bedrijfId) {
          throw new Error("Selecteer een bedrijf");
        }
      }

      // Create vacature
      if (!functietitel) {
        throw new Error("Functietitel is verplicht");
      }

      const { data: newVacature, error: vacatureError } = await supabase
        .from("vacatures")
        .insert([{
          bedrijf_id: bedrijfId,
          functietitel,
          vereisten: vereisten.length > 0 ? vereisten : [],
          aantal_posities: parseInt(aantalPosities) || 1,
          status: status as any,
          prioriteit: prioriteit as any,
          beloning: vacatureBeloning || null,
          opmerkingen: vacatureOpmerkingen || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (vacatureError) throw vacatureError;

      // Log activity
      await supabase.from("activity_log").insert({
        type: "vacature_toegevoegd",
        beschrijving: `Vacature ${functietitel} toegevoegd`,
        user_id: user.id,
        related_vacature_id: newVacature.id,
        related_bedrijf_id: bedrijfId,
      });

      toast({
        title: "Succesvol toegevoegd!",
        description: `Vacature ${functietitel} is aangemaakt`,
      });

      resetForm();
      await fetchBedrijven();
      await fetchVacatures();
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {!permissions.isRecruiter && (
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Vacaturebeheer</h1>
            <p className="text-muted-foreground">
              {permissions.canCreateVacancies 
                ? "Voeg nieuwe bedrijven en vacatures toe aan het systeem" 
                : "Bekijk openstaande vacatures"}
            </p>
          </div>
        )}

        {permissions.canCreateVacancies && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Nieuwe Vacature Toevoegen
              </CardTitle>
              <CardDescription>Vul alle benodigde informatie in om een vacature aan te maken</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bedrijf Selection */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={isNewBedrijf ? "default" : "outline"}
                    onClick={() => setIsNewBedrijf(true)}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nieuw Bedrijf
                  </Button>
                  <Button
                    type="button"
                    variant={!isNewBedrijf ? "default" : "outline"}
                    onClick={() => setIsNewBedrijf(false)}
                    className="flex-1"
                  >
                    Bestaand Bedrijf
                  </Button>
                </div>

                {isNewBedrijf ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrijfNaam">Bedrijfsnaam *</Label>
                        <Input
                          id="bedrijfNaam"
                          value={bedrijfNaam}
                          onChange={(e) => setBedrijfNaam(e.target.value)}
                          required
                          placeholder="Bijv. TechCorp B.V."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regio">Regio *</Label>
                        <Select value={regio} onValueChange={setRegio} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer regio" />
                          </SelectTrigger>
                          <SelectContent>
                            {regios.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plaats">Plaats</Label>
                        <Input
                          id="plaats"
                          value={plaats}
                          onChange={(e) => setPlaats(e.target.value)}
                          placeholder="Bijv. Amsterdam"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactpersoon">Contactpersoon</Label>
                        <Input
                          id="contactpersoon"
                          value={contactpersoon}
                          onChange={(e) => setContactpersoon(e.target.value)}
                          placeholder="Naam contactpersoon"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adres">Adres (voor kaartweergave)</Label>
                      <Input
                        id="adres"
                        value={adres}
                        onChange={(e) => setAdres(e.target.value)}
                        placeholder="Bijv. Keizersgracht 100, Amsterdam"
                      />
                      <p className="text-xs text-muted-foreground">
                        Voer een volledig adres in voor nauwkeurige pinpositie op de kaart
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefoon">Telefoon</Label>
                        <Input
                          id="telefoon"
                          value={telefoon}
                          onChange={(e) => setTelefoon(e.target.value)}
                          placeholder="06-12345678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="contact@bedrijf.nl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bedrijfBeloning">Beloning</Label>
                      <Input
                        id="bedrijfBeloning"
                        value={bedrijfBeloning}
                        onChange={(e) => setBedrijfBeloning(e.target.value)}
                        placeholder="Bijv. €50 per uur"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bedrijfOpmerkingen">Opmerkingen</Label>
                      <Textarea
                        id="bedrijfOpmerkingen"
                        value={bedrijfOpmerkingen}
                        onChange={(e) => setBedrijfOpmerkingen(e.target.value)}
                        placeholder="Extra informatie over het bedrijf"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="selectedBedrijf">Selecteer Bedrijf *</Label>
                    <Select value={selectedBedrijfId} onValueChange={setSelectedBedrijfId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een bedrijf" />
                      </SelectTrigger>
                      <SelectContent>
                        {bestaandeBedrijven.map((bedrijf) => (
                          <SelectItem key={bedrijf.id} value={bedrijf.id}>
                            {bedrijf.naam} - {bedrijf.regio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Vacature Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vacature Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="functietitel">Functietitel *</Label>
                  <Input
                    id="functietitel"
                    value={functietitel}
                    onChange={(e) => setFunctietitel(e.target.value)}
                    required
                    placeholder="Bijv. Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vereisten">Vereisten (druk op Enter of komma om toe te voegen)</Label>
                  <Input
                    id="vereisten"
                    value={vereistenInput}
                    onChange={(e) => setVereistenInput(e.target.value)}
                    onKeyDown={handleVereistenKeyDown}
                    onBlur={addVereiste}
                    placeholder="Bijv. HBO diploma, 3 jaar ervaring"
                  />
                  {vereisten.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {vereisten.map((vereiste, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeVereiste(index)}
                        >
                          {vereiste} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aantalPosities">Aantal Posities</Label>
                    <Input
                      id="aantalPosities"
                      type="number"
                      min="1"
                      value={aantalPosities}
                      onChange={(e) => setAantalPosities(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="invulling">In Vulling</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="gesloten">Gesloten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioriteit">Prioriteit</Label>
                    <Select value={prioriteit} onValueChange={setPrioriteit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laag">Laag</SelectItem>
                        <SelectItem value="normaal">Normaal</SelectItem>
                        <SelectItem value="hoog">Hoog</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vacatureBeloning">Beloning</Label>
                  <Input
                    id="vacatureBeloning"
                    value={vacatureBeloning}
                    onChange={(e) => setVacatureBeloning(e.target.value)}
                    placeholder="Bijv. €4000 - €5000 per maand"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vacatureOpmerkingen">Opmerkingen</Label>
                  <Textarea
                    id="vacatureOpmerkingen"
                    value={vacatureOpmerkingen}
                    onChange={(e) => setVacatureOpmerkingen(e.target.value)}
                    placeholder="Extra informatie over de vacature"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1 shadow-md">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNewBedrijf ? "Bedrijf & Vacature Toevoegen" : "Vacature Toevoegen"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Bestaande Vacatures */}
        {!permissions.isRecruiter && alleVacatures.length > 0 && (
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-orange-600" />
                    Bestaande Vacatures
                  </CardTitle>
                  <CardDescription>Verwijder alleen de vacature - het bedrijf blijft behouden</CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op titel, bedrijf, locatie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredVacatures.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? 'Geen vacatures gevonden voor deze zoekopdracht' : 'Nog geen vacatures'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Functietitel</TableHead>
                      <TableHead>Bedrijf</TableHead>
                      <TableHead>Locatie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioriteit</TableHead>
                      <TableHead>Posities</TableHead>
                      <TableHead className="text-right">Actie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVacatures.map((vacature) => (
                      <TableRow key={vacature.id}>
                        <TableCell className="font-medium">{vacature.functietitel}</TableCell>
                        <TableCell>{vacature.bedrijven?.naam || '-'}</TableCell>
                        <TableCell>
                          {vacature.bedrijven?.plaats ? `${vacature.bedrijven.plaats}, ` : ''}
                          {vacature.bedrijven?.regio || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              vacature.status === 'open'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : vacature.status === 'invulling'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : vacature.status === 'on_hold'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {vacature.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              vacature.prioriteit === 'urgent'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : vacature.prioriteit === 'hoog'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : vacature.prioriteit === 'normaal'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {vacature.prioriteit}
                          </Badge>
                        </TableCell>
                        <TableCell>{vacature.aantal_posities}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {permissions.canEditVacancies && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-primary/10 hover:text-primary"
                                onClick={() => openEditDialog(vacature)}
                                title="Bewerk vacature"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {permissions.canDeleteVacancies && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-orange-100 hover:text-orange-800"
                                onClick={() => deleteVacature(vacature.id, vacature.functietitel)}
                                title="Verwijder vacature (bedrijf blijft behouden)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gradient flex items-center gap-2">
                <Pencil className="h-6 w-6" />
                Vacature Bewerken
              </DialogTitle>
              <DialogDescription>
                Pas de vacature gegevens aan en voeg functie-eisen toe of verwijder ze
              </DialogDescription>
            </DialogHeader>

            {editingVacature && (
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-functietitel">Functietitel *</Label>
                  <Input
                    id="edit-functietitel"
                    value={editingVacature.functietitel}
                    onChange={(e) => setEditingVacature({ ...editingVacature, functietitel: e.target.value })}
                    placeholder="Bijv. Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-vereisten">Functie-eisen (druk op Enter of komma om toe te voegen)</Label>
                  <Input
                    id="edit-vereisten"
                    value={editVereistenInput}
                    onChange={(e) => setEditVereistenInput(e.target.value)}
                    onKeyDown={handleEditVereistenKeyDown}
                    onBlur={addEditVereiste}
                    placeholder="Bijv. HBO diploma, 3 jaar ervaring"
                  />
                  {editVereisten.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editVereisten.map((vereiste, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeEditVereiste(index)}
                        >
                          {vereiste} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-aantalPosities">Aantal Posities</Label>
                    <Input
                      id="edit-aantalPosities"
                      type="number"
                      min="1"
                      value={editingVacature.aantal_posities}
                      onChange={(e) => setEditingVacature({ ...editingVacature, aantal_posities: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={editingVacature.status} 
                      onValueChange={(value) => setEditingVacature({ ...editingVacature, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="invulling">In Vulling</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="gesloten">Gesloten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-prioriteit">Prioriteit</Label>
                    <Select 
                      value={editingVacature.prioriteit} 
                      onValueChange={(value) => setEditingVacature({ ...editingVacature, prioriteit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laag">Laag</SelectItem>
                        <SelectItem value="normaal">Normaal</SelectItem>
                        <SelectItem value="hoog">Hoog</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-beloning">Beloning</Label>
                  <Input
                    id="edit-beloning"
                    value={editingVacature.beloning || ''}
                    onChange={(e) => setEditingVacature({ ...editingVacature, beloning: e.target.value })}
                    placeholder="Bijv. €4000 - €5000 per maand"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-opmerkingen">Opmerkingen</Label>
                  <Textarea
                    id="edit-opmerkingen"
                    value={editingVacature.opmerkingen || ''}
                    onChange={(e) => setEditingVacature({ ...editingVacature, opmerkingen: e.target.value })}
                    placeholder="Extra informatie over de vacature"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={handleUpdateVacature} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Wijzigingen Opslaan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeEditDialog}
                    disabled={loading}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bestaande Bedrijven - Alleen voor Superadmin */}
        {permissions.isSuperAdmin && bestaandeBedrijven.length > 0 && (
          <Card className="border-2 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Bedrijven Beheer
              </CardTitle>
              <CardDescription className="text-destructive/80">
                <strong>Waarschuwing:</strong> Bij het verwijderen van een bedrijf worden ook alle bijbehorende vacatures en kandidaten permanent verwijderd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrijfsnaam</TableHead>
                    <TableHead>Regio</TableHead>
                    <TableHead>Plaats</TableHead>
                    <TableHead>Contactpersoon</TableHead>
                    <TableHead>Aantal Vacatures</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestaandeBedrijven.map((bedrijf) => {
                    const vacaturesCount = alleVacatures.filter(v => v.bedrijf_id === bedrijf.id).length;
                    return (
                      <TableRow key={bedrijf.id}>
                        <TableCell className="font-medium">{bedrijf.naam}</TableCell>
                        <TableCell>{bedrijf.regio}</TableCell>
                        <TableCell>{bedrijf.plaats || '-'}</TableCell>
                        <TableCell>{bedrijf.contactpersoon || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={vacaturesCount > 0 ? "default" : "secondary"}>
                            {vacaturesCount} vacature{vacaturesCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => deleteBedrijf(bedrijf.id, bedrijf.naam)}
                            title="Verwijder bedrijf (inclusief alle vacatures en kandidaten)"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Vacatures;
