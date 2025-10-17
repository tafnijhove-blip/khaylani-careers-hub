import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Plus, Bell, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  created_by: string | null;
}

interface CompanyWithVacancies extends Company {
  vacancies: Vacancy[];
  vacancyCount: number;
}

interface TeamMember {
  id: string;
  naam: string;
  email: string;
  user_roles: Array<{ role: string }>;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return [];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", profile.company_id);

      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profiles.map(p => p.id));

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      return profiles.map(p => ({
        ...p,
        user_roles: roles?.filter(r => r.user_id === p.id).map(r => ({ role: r.role })) || []
      })) as TeamMember[];
    },
  });

  useEffect(() => {
    fetchData();
    
    // Setup realtime subscriptions
    const vacanciesChannel = supabase
      .channel('manager-vacatures')
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
      .channel('manager-bedrijven')
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
      });

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

  // Team activity stats
  const teamActivityStats = useMemo(() => {
    if (!teamMembers) return [];
    
    return teamMembers.map(member => {
      const memberVacancies = vacancies.filter(v => v.created_by === member.id);
      const openCount = memberVacancies.filter(v => v.status === 'open').length;
      const filledCount = memberVacancies.filter(v => v.status === 'ingevuld').length;
      
      return {
        member,
        totalVacancies: memberVacancies.length,
        openVacancies: openCount,
        filledVacancies: filledCount
      };
    }).sort((a, b) => b.totalVacancies - a.totalVacancies);
  }, [teamMembers, vacancies]);

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
            <h1 className="text-4xl font-bold text-gradient mb-2">Manager Dashboard – stuur je team met inzicht</h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Zie precies waar je team actief is en waar je moet ingrijpen
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
          teamMembers={teamMembers?.length}
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

        {/* Team Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Activity */}
          <Card className="border-accent-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-purple" />
                Team Activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamActivityStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen teamactiviteit beschikbaar
                </div>
              ) : (
                <div className="space-y-3">
                  {teamActivityStats.slice(0, 5).map((stat) => (
                    <div
                      key={stat.member.id}
                      className="p-4 border rounded-lg hover:border-accent-purple/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{stat.member.naam}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stat.member.user_roles?.[0]?.role || 'Geen rol'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {stat.totalVacancies} vacatures
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-accent-cyan">
                          {stat.openVacancies} open
                        </span>
                        <span className="text-green-500">
                          {stat.filledVacancies} ingevuld
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Vacancies */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recente Activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vacancies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen activiteit beschikbaar
                </div>
              ) : (
                <div className="space-y-3">
                  {vacancies.slice(0, 5).map((vacancy) => {
                    const company = companies.find(c => c.id === vacancy.bedrijf_id);
                    return (
                      <div
                        key={vacancy.id}
                        className="p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => navigate(`/vacatures`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{vacancy.functietitel}</h3>
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

export default ManagerDashboard;
