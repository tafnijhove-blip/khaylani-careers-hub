import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, Plus, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch detacheringbureaus with user and vacancy counts
  const { data: detacheringbureaus, isLoading: loadingBureaus } = useQuery({
    queryKey: ['superadmin-detacheringbureaus'],
    queryFn: async () => {
      const { data: bedrijvenData, error: bedrijvenError } = await supabase
        .from('bedrijven')
        .select('*')
        .eq('type', 'detacheringbureau')
        .order('naam');

      if (bedrijvenError) throw bedrijvenError;

      // Get user counts per company
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('company_id');

      // Get vacancy counts per company
      const { data: vacaturesData } = await supabase
        .from('vacatures')
        .select('bedrijf_id');

      return bedrijvenData.map(bedrijf => ({
        ...bedrijf,
        userCount: profilesData?.filter(p => p.company_id === bedrijf.id).length || 0,
        vacancyCount: vacaturesData?.filter(v => v.bedrijf_id === bedrijf.id).length || 0,
      }));
    },
  });

  // Fetch klantbedrijven
  const { data: klantbedrijven, isLoading: loadingKlanten } = useQuery({
    queryKey: ['superadmin-klantbedrijven'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bedrijven')
        .select('*')
        .eq('type', 'klant')
        .order('naam');

      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingBureaus || loadingKlanten;

  // Fetch total statistics
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      const [
        { count: totalBureaus },
        { count: totalKlanten },
        { count: totalUsers },
        { count: totalVacancies }
      ] = await Promise.all([
        supabase.from('bedrijven').select('*', { count: 'exact', head: true }).eq('type', 'detacheringbureau'),
        supabase.from('bedrijven').select('*', { count: 'exact', head: true }).eq('type', 'klant'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('vacatures').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalBureaus: totalBureaus || 0,
        totalKlanten: totalKlanten || 0,
        totalUsers: totalUsers || 0,
        totalVacancies: totalVacancies || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Superadmin dashboard laden..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Superadmin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Beheer alle bedrijven, gebruikers en vacatures
            </p>
          </div>
          <Button onClick={() => navigate('/bedrijven/nieuw')} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nieuw Bedrijf
          </Button>
        </header>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Detacheringbureaus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{stats?.totalBureaus || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Klantbedrijven
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{stats?.totalKlanten || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Totaal Gebruikers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Totaal Vacatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{stats?.totalVacancies || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detacheringbureaus List */}
        <Card>
          <CardHeader>
            <CardTitle>Detacheringbureaus</CardTitle>
            <CardDescription>Bedrijven die de app gebruiken om hun kandidaten te plaatsen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detacheringbureaus?.map((bureau) => (
                <div
                  key={bureau.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg glass-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{bureau.naam}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bureau.plaats} • {bureau.regio}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{bureau.userCount}</div>
                      <div className="text-xs text-muted-foreground">Gebruikers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{bureau.vacancyCount}</div>
                      <div className="text-xs text-muted-foreground">Vacatures</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bedrijf/${bureau.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Bekijken
                    </Button>
                  </div>
                </div>
              ))}
              {(!detacheringbureaus || detacheringbureaus.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Nog geen detacheringbureaus toegevoegd
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Klantbedrijven List */}
        <Card>
          <CardHeader>
            <CardTitle>Klantbedrijven</CardTitle>
            <CardDescription>Bedrijven waar kandidaten geplaatst worden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {klantbedrijven?.map((klant) => (
                <div
                  key={klant.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-border/50 hover:border-border transition-all hover:shadow-lg glass-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{klant.naam}</h3>
                      <p className="text-sm text-muted-foreground">
                        {klant.plaats} • {klant.regio}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bedrijf/${klant.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Bekijken
                    </Button>
                  </div>
                </div>
              ))}
              {(!klantbedrijven || klantbedrijven.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Nog geen klantbedrijven toegevoegd
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
