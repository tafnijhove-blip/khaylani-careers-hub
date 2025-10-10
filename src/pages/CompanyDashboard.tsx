import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Plus, Eye } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserRole, useUserProfile } from "@/hooks/useUserRole";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { data: role } = useUserRole();
  const { data: profile } = useUserProfile();

  // Use companyId from URL or from profile
  const activeCompanyId = companyId || profile?.company_id;

  // Fetch company details
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      
      const { data, error } = await supabase
        .from('bedrijven')
        .select('*')
        .eq('id', activeCompanyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
  });

  // Fetch company vacancies
  const { data: vacatures, isLoading: vacaturesLoading } = useQuery({
    queryKey: ['company-vacatures', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from('vacatures')
        .select('*')
        .eq('bedrijf_id', activeCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
  });

  // Fetch company users (only for CEO and management)
  const { data: users } = useQuery({
    queryKey: ['company-users', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('company_id', activeCompanyId);

      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && (role === 'ceo' || role === 'superadmin'),
  });

  const isLoading = companyLoading || vacaturesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Bedrijfsdashboard laden..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Bedrijf niet gevonden</h2>
          <p className="text-muted-foreground mt-2">
            Je hebt geen toegang tot dit bedrijf of het bestaat niet.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient">{company.naam}</h1>
            <p className="text-muted-foreground mt-2">
              {company.plaats} • {company.regio}
            </p>
          </div>
          {(role === 'ceo' || role === 'accountmanager' || role === 'superadmin') && (
            <Button onClick={() => navigate('/vacatures/nieuw')} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nieuwe Vacature
            </Button>
          )}
        </header>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Actieve Vacatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">
                {vacatures?.filter(v => v.status === 'open').length || 0}
              </div>
            </CardContent>
          </Card>

          {(role === 'ceo' || role === 'superadmin') && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Teamleden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gradient">{users?.length || 0}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vacancies List */}
        <Card>
          <CardHeader>
            <CardTitle>Vacatures</CardTitle>
            <CardDescription>Beheer de vacatures van {company.naam}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vacatures?.map((vacature) => (
                <div
                  key={vacature.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg glass-card"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{vacature.functietitel}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVacatureStatusClass(vacature.status)}`}>
                        {vacature.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityClass(vacature.prioriteit)}`}>
                        {vacature.prioriteit}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {vacature.aantal_posities} {vacature.aantal_posities === 1 ? 'positie' : 'posities'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/vacatures/${vacature.id}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users List (CEO only) */}
        {(role === 'ceo' || role === 'superadmin') && users && (
          <Card>
            <CardHeader>
              <CardTitle>Teamleden</CardTitle>
              <CardDescription>Beheer gebruikers van {company.naam}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 glass-card"
                  >
                    <div>
                      <h3 className="font-semibold">{user.naam}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {user.user_roles?.[0]?.role || 'Geen rol'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;
