import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Briefcase, Search, Plus, AlertCircle, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";
import { VacatureDetailDialog } from "@/components/VacatureDetailDialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog-custom";

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
  beloning: string | null;
  opmerkingen: string | null;
  datum_toegevoegd: string;
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
  const permissions = usePermissions();
  const [bedrijven, setBedrijven] = useState<Bedrijf[]>([]);
  const [vacatures, setVacatures] = useState<Vacature[]>([]);
  const [vacatureStats, setVacatureStats] = useState<VacatureStat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVacature, setSelectedVacature] = useState<Vacature | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteVacatureDialog, setDeleteVacatureDialog] = useState<{open: boolean, id: string, titel: string}>({open: false, id: '', titel: ''});
  const [deleteBedrijfDialog, setDeleteBedrijfDialog] = useState<{open: boolean, id: string, naam: string, vacatures: number}>({open: false, id: '', naam: '', vacatures: 0});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bedrijvenResponse, vacaturesResponse, vacatureStatsResponse] = await Promise.all([
        supabase.from("bedrijven").select("*").eq("type", "klant").order("naam"),
        supabase.from("vacatures").select("id, functietitel, status, prioriteit, aantal_posities, bedrijf_id, vereisten, beloning, opmerkingen, datum_toegevoegd").order("datum_toegevoegd", { ascending: false }),
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
    setDeleteVacatureDialog({open: true, id: vacatureId, titel: functietitel});
  };

  const confirmDeleteVacature = async () => {
    try {
      const { error } = await supabase.from("vacatures").delete().eq("id", deleteVacatureDialog.id);

      if (error) throw error;

      toast({
        title: "✓ Vacature verwijderd",
        description: `${deleteVacatureDialog.titel} is succesvol verwijderd`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteVacatureDialog({open: false, id: '', titel: ''});
    }
  };

  const deleteBedrijf = async (bedrijfId: string, bedrijfNaam: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const bedrijfVacatures = getVacaturesForBedrijf(bedrijfId);
    setDeleteBedrijfDialog({open: true, id: bedrijfId, naam: bedrijfNaam, vacatures: bedrijfVacatures.length});
  };

  const confirmDeleteBedrijf = async () => {
    try {
      const bedrijfVacatures = getVacaturesForBedrijf(deleteBedrijfDialog.id);
      
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
        .eq("bedrijf_id", deleteBedrijfDialog.id);

      if (vacaturesError) throw vacaturesError;

      // Finally delete the bedrijf
      const { error: bedrijfError } = await supabase
        .from("bedrijven")
        .delete()
        .eq("id", deleteBedrijfDialog.id);

      if (bedrijfError) throw bedrijfError;

      toast({
        title: "✓ Bedrijf verwijderd",
        description: `${deleteBedrijfDialog.naam} en alle bijbehorende vacatures zijn verwijderd`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteBedrijfDialog({open: false, id: '', naam: '', vacatures: 0});
    }
  };

  const getVacaturesForBedrijf = (bedrijfId: string) => {
    return vacatures.filter((v) => v.bedrijf_id === bedrijfId);
  };

  const filteredBedrijven = useMemo(() => 
    bedrijven.filter(
      (b) =>
        b.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.regio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.plaats && b.plaats.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [bedrijven, searchTerm]
  );

  const handleDeleteVacature = useCallback((vacatureId: string, functietitel: string) => {
    return deleteVacature(vacatureId, functietitel);
  }, []);

  const handleDeleteBedrijf = useCallback((bedrijfId: string, bedrijfNaam: string) => {
    return deleteBedrijf(bedrijfId, bedrijfNaam);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Dashboard laden..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Kaartoverzicht</h1>
            <p className="text-muted-foreground text-lg">Interactief overzicht van alle bedrijven en vacatures</p>
          </div>
          {permissions.canCreateVacancies && (
            <Button onClick={() => navigate("/vacatures")} className="gap-2 shadow-glow">
              <Plus className="h-5 w-5" />
              Nieuwe Vacature
            </Button>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          <Card className="border-primary/20 hover:border-primary/40 hover:shadow-glow transition-all duration-500 glow-border overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Bedrijven</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient" role="status" aria-label={`Totaal ${bedrijven.length} bedrijven`}>
                {bedrijven.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent-cyan/20 hover:border-accent-cyan/40 hover:shadow-glow-cyan transition-all duration-500 glow-border overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Vacatures</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-cyan to-accent-teal flex items-center justify-center shadow-glow-cyan group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-accent-cyan to-accent-teal bg-clip-text text-transparent">
                {vacatures.filter((v) => v.status === "open").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent-purple/20 hover:border-accent-purple/40 hover:shadow-glow transition-all duration-500 glow-border overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Posities</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-purple to-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-accent-purple to-primary bg-clip-text text-transparent">
                {vacatures.reduce((sum, v) => sum + v.aantal_posities, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Zoek op bedrijfsnaam, regio of plaats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
            aria-label="Zoek bedrijven"
          />
        </div>

        {/* Bedrijven List */}
        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-6 text-gradient">Bedrijven & Vacatures</h2>
          {filteredBedrijven.length === 0 ? (
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-glass">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-24 w-24 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
                  <AlertCircle className="h-12 w-12 text-primary" />
                </div>
                <p className="text-xl font-semibold text-foreground mb-2">Geen bedrijven gevonden</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {permissions.canCreateVacancies 
                    ? "Begin met het toevoegen van een bedrijf en vacature"
                    : "Nog geen bedrijven beschikbaar"}
                </p>
                {permissions.canCreateVacancies && (
                  <Button onClick={() => navigate("/vacatures")} className="gap-2">
                    <Plus className="h-5 w-5" />
                    Nieuwe Vacature Toevoegen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBedrijven.map((bedrijf) => {
                const bedrijfVacatures = getVacaturesForBedrijf(bedrijf.id);
                return (
                  <Card
                    key={bedrijf.id}
                    className="border-2 border-primary/10 hover:border-primary/40 hover:shadow-glow transition-all duration-500 group relative overflow-hidden glow-border"
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
                                <div 
                                  key={vacature.id} 
                                  className="p-2 bg-muted/50 rounded-lg text-sm group/vacature cursor-pointer hover:bg-muted/80 hover:shadow-md transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Vacature clicked:', vacature);
                                    setSelectedVacature(vacature);
                                    setDialogOpen(true);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setSelectedVacature(vacature);
                                      setDialogOpen(true);
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium truncate">{vacature.functietitel}</span>
                                    <div className="flex items-center gap-1">
                                      <Badge className={getPriorityClass(vacature.prioriteit)} variant="outline">
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
                                    <Badge className={getVacatureStatusClass(vacature.status)} variant="outline">
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

      <VacatureDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vacature={selectedVacature}
        bedrijf={selectedVacature ? bedrijven.find(b => b.id === selectedVacature.bedrijf_id) || null : null}
        stats={selectedVacature ? vacatureStats.find(vs => vs.id === selectedVacature.id) || null : null}
      />

      {/* Delete Vacature Confirmation */}
      <ConfirmDialog
        open={deleteVacatureDialog.open}
        onOpenChange={(open) => setDeleteVacatureDialog({...deleteVacatureDialog, open})}
        title="Vacature verwijderen?"
        description={`Weet je zeker dat je de vacature "${deleteVacatureDialog.titel}" wilt verwijderen?\n\nLET OP: Alleen de vacature wordt verwijderd, niet het bedrijf.`}
        onConfirm={confirmDeleteVacature}
        confirmText="Vacature verwijderen"
        variant="destructive"
      />

      {/* Delete Bedrijf Confirmation */}
      <ConfirmDialog
        open={deleteBedrijfDialog.open}
        onOpenChange={(open) => setDeleteBedrijfDialog({...deleteBedrijfDialog, open})}
        title="Bedrijf verwijderen?"
        description={deleteBedrijfDialog.vacatures > 0 
          ? `LET OP: Dit bedrijf heeft ${deleteBedrijfDialog.vacatures} actieve vacature(s).\n\nAls je "${deleteBedrijfDialog.naam}" verwijdert, worden ook alle bijbehorende vacatures en kandidaten permanent verwijderd.\n\nWeet je zeker dat je door wilt gaan?`
          : `Weet je zeker dat je bedrijf "${deleteBedrijfDialog.naam}" wilt verwijderen?`
        }
        onConfirm={confirmDeleteBedrijf}
        confirmText="Bedrijf verwijderen"
        variant="destructive"
      />
    </DashboardLayout>
  );
};

export default Dashboard;
