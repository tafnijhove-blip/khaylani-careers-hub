import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Plus, Bell, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import DashboardInteractiveMap from "@/components/dashboard/DashboardInteractiveMap";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpdateCompanyCoordinates from "@/components/UpdateCompanyCoordinates";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";

interface Company {
  id: string;
  naam: string;
  plaats: string | null;
  regio: string;
  lat: number;
  lng: number;
  logo_url: string | null;
  adres: string | null;
}

interface Vacancy {
  id: string;
  functietitel: string;
  bedrijf_id: string;
  status: string;
  prioriteit: string;
  aantal_posities: number;
  datum_toegevoegd: string;
}

interface CompanyWithVacancies extends Company {
  vacancies: Vacancy[];
  vacancyCount: number;
}

const AccountManagerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [companiesWithoutCoords, setCompaniesWithoutCoords] = useState<CompanyWithVacancies[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  useEffect(() => {
    fetchData();
    
    // Setup realtime subscriptions
    const vacanciesChannel = supabase
      .channel('am-vacatures')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacatures'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          toast({
            title: "Nieuwe update",
            description: "Er is een wijziging in de vacatures",
          });
          fetchData();
        }
      )
      .subscribe();

    const companiesChannel = supabase
      .channel('am-bedrijven')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bedrijven'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vacanciesChannel);
      supabase.removeChannel(companiesChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [companiesRes, companiesWithoutCoordsRes, vacanciesRes] = await Promise.all([
        supabase
          .from("bedrijven")
          .select("*")
          .eq("type", "klant")
          .not("lat", "is", null)
          .not("lng", "is", null),
        supabase
          .from("bedrijven")
          .select("*")
          .eq("type", "klant")
          .or("lat.is.null,lng.is.null"),
        supabase
          .from("vacatures")
          .select("*")
          .order("datum_toegevoegd", { ascending: false })
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (companiesWithoutCoordsRes.error) throw companiesWithoutCoordsRes.error;
      if (vacanciesRes.error) throw vacanciesRes.error;

      const companiesWithVacancies: CompanyWithVacancies[] = (companiesRes.data || []).map(company => {
        const companyVacancies = (vacanciesRes.data || []).filter((v: Vacancy) => v.bedrijf_id === company.id);
        return {
          ...company,
          vacancies: companyVacancies,
          vacancyCount: companyVacancies.filter((v: Vacancy) => v.status === 'open').length
        };
      });

      const companiesWithoutCoordsWithVacancies: CompanyWithVacancies[] = (companiesWithoutCoordsRes.data || []).map(company => {
        const companyVacancies = (vacanciesRes.data || []).filter((v: Vacancy) => v.bedrijf_id === company.id);
        return {
          ...company,
          vacancies: companyVacancies,
          vacancyCount: companyVacancies.filter((v: Vacancy) => v.status === 'open').length
        };
      });

      setCompanies(companiesWithVacancies);
      setCompaniesWithoutCoords(companiesWithoutCoordsWithVacancies);
      setVacancies(vacanciesRes.data || []);
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

  const openVacancies = useMemo(() => vacancies.filter(v => v.status === 'open').length, [vacancies]);
  const filledVacancies = useMemo(() => vacancies.filter(v => v.status === 'ingevuld').length, [vacancies]);
  const totalPositions = useMemo(() => vacancies.reduce((sum, v) => sum + v.aantal_posities, 0), [vacancies]);

  const regionalStats = useMemo(() => {
    const stats = companies.reduce((acc, company) => {
      if (!acc[company.regio]) {
        acc[company.regio] = 0;
      }
      acc[company.regio] += company.vacancyCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

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
            <h1 className="text-4xl font-bold text-gradient mb-2">Account Manager Dashboard</h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Overzicht van klanten, vacatures en recruiter-activiteiten
            </p>
          </div>
          <Button onClick={() => navigate("/vacatures")} className="gap-2 shadow-glow">
            <Plus className="h-5 w-5" />
            Nieuwe Vacature
          </Button>
        </header>

        {/* Stats */}
        <DashboardStats
          totalCompanies={companies.length}
          openVacancies={openVacancies}
          filledVacancies={filledVacancies}
          totalPositions={totalPositions}
          regionalStats={regionalStats}
          onRegionClick={setSelectedRegion}
        />

        {/* Interactive Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gradient">Interactieve Kaart</h2>
            {selectedRegion !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRegion("all")}
              >
                Toon alle regio's
              </Button>
            )}
          </div>
          <DashboardInteractiveMap
            companies={companies}
            selectedRegion={selectedRegion}
            minVacancies={0}
          />
        </div>

        {/* Companies without coordinates */}
        {companiesWithoutCoords.length > 0 && (
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <MapPin className="h-5 w-5" />
                Bedrijven zonder locatie ({companiesWithoutCoords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deze bedrijven hebben geen coördinaten en zijn daarom niet zichtbaar op de kaart. Voeg een locatie toe om ze te tonen.
              </p>
              <div className="space-y-2">
                {companiesWithoutCoords.map((company) => (
                  <div 
                    key={company.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{company.naam}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.adres && `${company.adres}, `}{company.plaats} - {company.regio}
                      </p>
                    </div>
                    {company.adres && company.plaats && (
                      <UpdateCompanyCoordinates
                        companyId={company.id}
                        companyName={company.naam}
                        address={company.adres}
                        city={company.plaats}
                        onSuccess={fetchData}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clients & Vacancies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Clients */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Mijn Klanten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen klanten beschikbaar
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.slice(0, 5).map((company) => (
                    <div
                      key={company.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/bedrijf/${company.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{company.naam}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.regio}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {company.vacancyCount} {company.vacancyCount === 1 ? 'vacature' : 'vacatures'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Vacancies */}
          <Card className="border-accent-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent-cyan" />
                Recente Vacatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vacancies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen vacatures beschikbaar
                </div>
              ) : (
                <div className="space-y-3">
                  {vacancies.slice(0, 5).map((vacancy) => {
                    const company = companies.find(c => c.id === vacancy.bedrijf_id);
                    return (
                      <div
                        key={vacancy.id}
                        className="p-4 border rounded-lg hover:border-accent-cyan/50 transition-all cursor-pointer"
                        onClick={() => navigate(`/vacatures`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{vacancy.functietitel}</h3>
                            {company && (
                              <p className="text-sm text-muted-foreground">
                                {company.naam}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getVacatureStatusClass(vacancy.status)}>
                              {vacancy.status}
                            </Badge>
                            <Badge className={getPriorityClass(vacancy.prioriteit)} variant="outline">
                              {vacancy.prioriteit}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountManagerDashboard;
