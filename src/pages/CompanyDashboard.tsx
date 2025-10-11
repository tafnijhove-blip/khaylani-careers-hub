import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Briefcase, Users, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUserRole } from "@/hooks/useUserRole";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { data: userRole } = useUserRole();
  
  // Get company_id from URL or user profile
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const activeCompanyId = companyId || userProfile?.company_id;

  // Fetch company details
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      
      const { data, error } = await supabase
        .from("bedrijven")
        .select("*")
        .eq("id", activeCompanyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
  });

  // Fetch all vacancies for this company
  const { data: vacatures, isLoading: vacaturesLoading } = useQuery({
    queryKey: ["company-vacatures", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from("vacatures")
        .select("*")
        .eq("bedrijf_id", activeCompanyId)
        .order("datum_toegevoegd", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  // Fetch users for this company (only for CEO and superadmin)
  const { data: companyUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["company-users", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role)
        `)
        .eq("company_id", activeCompanyId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCompanyId && (userRole === 'ceo' || userRole === 'superadmin'),
  });

  const isLoading = companyLoading || vacaturesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Dashboard laden..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Bedrijf niet gevonden</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const activeVacatures = vacatures?.filter(v => v.status === "open").length || 0;
  const totalVacatures = vacatures?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Company Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-gradient">{company.naam}</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{company.regio}{company.plaats && ` • ${company.plaats}`}</span>
            </div>
          </div>
          <Button onClick={() => navigate("/vacatures")} className="gap-2">
            <Plus className="h-5 w-5" />
            Nieuwe Vacature
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actieve Vacatures</CardTitle>
              <Briefcase className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{activeVacatures}</div>
              <p className="text-sm text-muted-foreground mt-1">van {totalVacatures} totaal</p>
            </CardContent>
          </Card>

          {(userRole === 'ceo' || userRole === 'superadmin') && (
            <Card className="border-accent-purple/20">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Teamleden</CardTitle>
                <Users className="h-8 w-8 text-accent-purple" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-accent-purple">{companyUsers?.length || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">actieve gebruikers</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vacatures */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Vacatures</CardTitle>
          </CardHeader>
          <CardContent>
            {totalVacatures === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nog geen vacatures voor dit bedrijf</p>
                <Button onClick={() => navigate("/vacatures")} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Eerste Vacature Toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vacatures?.map((vacature) => (
                  <div
                    key={vacature.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/vacatures`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{vacature.functietitel}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getVacatureStatusClass(vacature.status)}>
                          {vacature.status}
                        </Badge>
                        <Badge className={getPriorityClass(vacature.prioriteit)} variant="outline">
                          {vacature.prioriteit}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vacature.aantal_posities} {vacature.aantal_posities === 1 ? 'positie' : 'posities'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members (only for CEO and superadmin) */}
        {(userRole === 'ceo' || userRole === 'superadmin') && companyUsers && companyUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Teamleden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.naam}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">
                      {user.user_roles?.[0]?.role || "Geen rol"}
                    </Badge>
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
