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

  // Fetch all companies with user and vacancy counts
  const { data: companies, isLoading } = useQuery({
    queryKey: ['superadmin-companies'],
    queryFn: async () => {
      const { data: bedrijvenData, error: bedrijvenError } = await supabase
        .from('bedrijven')
        .select('*')
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

  // Fetch total statistics
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      const [
        { count: totalCompanies },
        { count: totalUsers },
        { count: totalVacancies }
      ] = await Promise.all([
        supabase.from('bedrijven').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('vacatures').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalCompanies: totalCompanies || 0,
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Totaal Bedrijven
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{stats?.totalCompanies || 0}</div>
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

        {/* Companies List */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Bedrijven</CardTitle>
            <CardDescription>Klik op een bedrijf om details te bekijken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies?.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg glass-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{company.naam}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.plaats} • {company.regio}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{company.userCount}</div>
                      <div className="text-xs text-muted-foreground">Gebruikers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{company.vacancyCount}</div>
                      <div className="text-xs text-muted-foreground">Vacatures</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bedrijf/${company.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Bekijken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
