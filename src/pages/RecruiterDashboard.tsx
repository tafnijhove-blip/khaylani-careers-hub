import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Plus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import LeafletDashboardMap from "@/components/map/LeafletDashboardMap";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";

interface Company {
  id: string;
  naam: string;
  plaats: string | null;
  regio: string;
  lat: number;
  lng: number;
  logo_url: string | null;
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

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  useEffect(() => {
    fetchData();
    
    // Setup realtime subscription for vacancies
    const channel = supabase
      .channel('recruiter-vacatures')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [companiesRes, vacanciesRes] = await Promise.all([
        supabase
          .from("bedrijven")
          .select("*")
          .eq("type", "klant")
          .not("lat", "is", null)
          .not("lng", "is", null),
        supabase
          .from("vacatures")
          .select("*")
          .order("datum_toegevoegd", { ascending: false })
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (vacanciesRes.error) throw vacanciesRes.error;

      const companiesWithVacancies: CompanyWithVacancies[] = (companiesRes.data || []).map(company => {
        const companyVacancies = (vacanciesRes.data || []).filter((v: Vacancy) => v.bedrijf_id === company.id);
        return {
          ...company,
          vacancies: companyVacancies,
          vacancyCount: companyVacancies.filter((v: Vacancy) => v.status === 'open').length
        };
      }).filter(c => c.vacancyCount > 0);

      setCompanies(companiesWithVacancies);
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
            <h1 className="text-4xl font-bold text-gradient mb-2">Recruiter Dashboard</h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Realtime overzicht van alle klanten en openstaande vacatures
            </p>
          </div>
          <Button onClick={() => navigate("/vacatures")} className="gap-2 shadow-glow">
            <Briefcase className="h-5 w-5" />
            Bekijk Alle Vacatures
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
          <LeafletDashboardMap
            companies={companies}
            selectedRegion={selectedRegion}
            minVacancies={0}
            showHeatmap={true}
          />
        </div>

        {/* Recent Vacancies */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Recente Openstaande Vacatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vacancies.filter(v => v.status === 'open').slice(0, 10).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Geen openstaande vacatures beschikbaar
              </div>
            ) : (
              <div className="space-y-3">
                {vacancies.filter(v => v.status === 'open').slice(0, 10).map((vacancy) => {
                  const company = companies.find(c => c.id === vacancy.bedrijf_id);
                  return (
                    <div
                      key={vacancy.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/vacatures`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{vacancy.functietitel}</h3>
                          {company && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {company.naam} • {company.regio}
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
                      <p className="text-sm text-muted-foreground">
                        {vacancy.aantal_posities} {vacancy.aantal_posities === 1 ? 'positie' : 'posities'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
