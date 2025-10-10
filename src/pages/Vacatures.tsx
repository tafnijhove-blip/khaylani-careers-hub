import { useState, useEffect } from "react";
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
import { Building2, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const regios = ["Noord-Holland", "Zuid-Holland", "Utrecht", "Gelderland", "Noord-Brabant", "Limburg", "Zeeland", "Friesland", "Groningen", "Drenthe", "Overijssel", "Flevoland"];

const Vacatures = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isNewBedrijf, setIsNewBedrijf] = useState(true);
  const [bestaandeBedrijven, setBestaandeBedrijven] = useState<any[]>([]);
  const [vereistenInput, setVereistenInput] = useState("");
  
  // Bedrijf fields
  const [bedrijfNaam, setBedrijfNaam] = useState("");
  const [regio, setRegio] = useState("");
  const [plaats, setPlaats] = useState("");
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

        const { data: newBedrijf, error: bedrijfError } = await supabase
          .from("bedrijven")
          .insert({
            naam: bedrijfNaam,
            regio,
            plaats: plaats || null,
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
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Vacaturebeheer</h1>
          <p className="text-muted-foreground">Voeg nieuwe bedrijven en vacatures toe aan het systeem</p>
        </div>

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
      </div>
    </DashboardLayout>
  );
};

export default Vacatures;
