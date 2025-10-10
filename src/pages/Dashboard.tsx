import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Briefcase, Search, Plus, AlertCircle, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";

interface Bedrijf {
  id: string;
  naam: string;
  regio: string;
  plaats: string | null;
  logo_url: string | null;
  contactpersoon: string | null;
  lat: number | null;
  lng: number | null;
}

interface Vacature {
  id: string;
  functietitel: string;
  status: string;
  prioriteit: string;
  aantal_posities: number;
  bedrijf_id: string;
  vereisten: string[] | null;
}

interface VacatureStat {
  id: string;
  bedrijf_id: string;
  functietitel: string;
  aantal_posities: number;
  status: string;
  prioriteit: string;
  posities_vervuld: number;
  posities_open: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bedrijven, setBedrijven] = useState<Bedrijf[]>([]);
  const [vacatures, setVacatures] = useState<Vacature[]>([]);
  const [vacatureStats, setVacatureStats] = useState<VacatureStat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bedrijvenResponse, vacaturesResponse, vacatureStatsResponse] = await Promise.all([
        supabase.from("bedrijven").select("*").order("naam"),
        supabase.from("vacatures").select("*").order("datum_toegevoegd", { ascending: false }),
        supabase.from("vacature_stats").select("*"),
      ]);

      if (bedrijvenResponse.error) throw bedrijvenResponse.error;
      if (vacaturesResponse.error) throw vacaturesResponse.error;
      if (vacatureStatsResponse.error) throw vacatureStatsResponse.error;

      setBedrijven(bedrijvenResponse.data || []);
      setVacatures(vacaturesResponse.data || []);
      setVacatureStats(vacatureStatsResponse.data || []);
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

  const deleteVacature = async (vacatureId: string, functietitel: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBedrijf = async (bedrijfId: string, bedrijfNaam: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Check if there are vacatures for this bedrijf
    const bedrijfVacatures = getVacaturesForBedrijf(bedrijfId);
    
    if (bedrijfVacatures.length > 0) {
      if (!confirm(`LET OP: Dit bedrijf heeft ${bedrijfVacatures.length} actieve vacature(s).\n\nAls je "${bedrijfNaam}" verwijdert, worden ook alle bijbehorende vacatures en kandidaten permanent verwijderd.\n\nWeet je zeker dat je door wilt gaan?`)) {
        return;
      }
    } else {
      if (!confirm(`Weet je zeker dat je bedrijf "${bedrijfNaam}" wilt verwijderen?`)) {
        return;
      }
    }

    try {
      // First delete all kandidaten for vacatures of this bedrijf
      const { error: kandidatenError } = await supabase
        .from("kandidaten")
        .delete()
        .in("vacature_id", bedrijfVacatures.map(v => v.id));

      if (kandidatenError) throw kandidatenError;

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

      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getVacaturesForBedrijf = (bedrijfId: string) => {
    return vacatures.filter((v) => v.bedrijf_id === bedrijfId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200";
      case "invulling":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "on_hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "gesloten":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "hoog":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normaal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "laag":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredBedrijven = bedrijven.filter(
    (b) =>
      b.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.regio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.plaats && b.plaats.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laden...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Kaartoverzicht</h1>
            <p className="text-muted-foreground">Interactief overzicht van alle bedrijven en vacatures</p>
          </div>
          <Button onClick={() => navigate("/vacatures")} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Nieuwe Vacature
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Bedrijven</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{bedrijven.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Vacatures</CardTitle>
              <Briefcase className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {vacatures.filter((v) => v.status === "open").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Posities</CardTitle>
              <MapPin className="h-5 w-5 text-accent-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {vacatures.reduce((sum, v) => sum + v.aantal_posities, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op bedrijfsnaam, regio of plaats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        {/* Interactive Map */}
        <Card className="border-2 overflow-hidden">
          <CardHeader className="bg-gradient-primary text-white">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactieve Kaart Nederland
            </CardTitle>
            <CardDescription className="text-white/80">
              Visueel overzicht van alle bedrijfslocaties en vacatures
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px]">
              <MapView bedrijven={bedrijven} vacatures={vacatures} vacatureStats={vacatureStats} />
            </div>
          </CardContent>
        </Card>

        {/* Bedrijven List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Bedrijven & Vacatures</h2>
          {filteredBedrijven.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Geen bedrijven gevonden</p>
                <p className="text-sm text-muted-foreground mb-4">Begin met het toevoegen van een bedrijf en vacature</p>
                <Button onClick={() => navigate("/vacatures")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nieuwe Vacature Toevoegen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBedrijven.map((bedrijf) => {
                const bedrijfVacatures = getVacaturesForBedrijf(bedrijf.id);
                return (
                  <Card
                    key={bedrijf.id}
                    className="border-2 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
                      onClick={(e) => deleteBedrijf(bedrijf.id, bedrijf.naam, e)}
                      title="Verwijder bedrijf (inclusief alle vacatures)"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors pr-10">
                            {bedrijf.naam}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {bedrijf.regio}
                            {bedrijf.plaats && ` • ${bedrijf.plaats}`}
                          </CardDescription>
                        </div>
                        {bedrijf.logo_url && (
                          <img src={bedrijf.logo_url} alt={bedrijf.naam} className="h-12 w-12 object-contain rounded" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bedrijf.contactpersoon && (
                          <p className="text-sm text-muted-foreground">Contact: {bedrijf.contactpersoon}</p>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Vacatures</span>
                            <Badge variant="secondary">{bedrijfVacatures.length}</Badge>
                          </div>
                          {bedrijfVacatures.length > 0 ? (
                            <div className="space-y-2">
                              {bedrijfVacatures.slice(0, 2).map((vacature) => {
                                const stat = vacatureStats.find(vs => vs.id === vacature.id);
                                const vervuld = stat?.posities_vervuld || 0;
                                const open = stat?.posities_open || vacature.aantal_posities;
                                
                                return (
                                <div key={vacature.id} className="p-2 bg-muted/50 rounded-lg text-sm group/vacature">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium truncate">{vacature.functietitel}</span>
                                    <div className="flex items-center gap-1">
                                      <Badge className={getPriorityColor(vacature.prioriteit)} variant="outline">
                                        {vacature.prioriteit}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover/vacature:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteVacature(vacature.id, vacature.functietitel, e);
                                        }}
                                        title="Verwijder vacature (bedrijf blijft behouden)"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={getStatusColor(vacature.status)} variant="outline">
                                      {vacature.status}
                                    </Badge>
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {vervuld}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-orange-600 font-medium">
                                      ○ {open} open
                                    </span>
                                  </div>
                                </div>
                                );
                              })}
                              {bedrijfVacatures.length > 2 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  +{bedrijfVacatures.length - 2} meer...
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">Geen vacatures</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
