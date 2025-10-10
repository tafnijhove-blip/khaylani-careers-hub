import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Plus, Mail, Phone, MapPin, Trash2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bedrijven");

  // Fetch companies
  const { data: bedrijven, isLoading: loadingBedrijven, refetch: refetchBedrijven } = useQuery({
    queryKey: ['superadmin-bedrijven'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bedrijven')
        .select('*')
        .order('naam');

      if (error) throw error;
      return data;
    },
  });

  // Fetch users with their roles
  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role),
          bedrijven(naam)
        `)
        .order('naam');

      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const handleDeleteBedrijf = async (bedrijfId: string) => {
    if (!confirm('Weet je zeker dat je dit bedrijf wilt verwijderen?')) return;

    const { error } = await supabase
      .from('bedrijven')
      .delete()
      .eq('id', bedrijfId);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon bedrijf niet verwijderen",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verwijderd",
        description: "Bedrijf succesvol verwijderd",
      });
      refetchBedrijven();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'ceo': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'accountmanager': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'recruiter': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Superadmin';
      case 'ceo': return 'CEO';
      case 'accountmanager': return 'Account Manager';
      case 'recruiter': return 'Recruiter';
      default: return role;
    }
  };

  if (loadingBedrijven || loadingUsers) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Dashboard laden..." />
        </div>
      </SuperAdminLayout>
    );
  }

  const detacheringbureaus = bedrijven?.filter(b => b.type === 'detacheringbureau') || [];
  const klantbedrijven = bedrijven?.filter(b => b.type === 'klant') || [];

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-gradient">Superadmin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Beheer alle bedrijven en gebruikers in het systeem
          </p>
        </header>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Detacheringbureaus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{detacheringbureaus.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Klantbedrijven</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{klantbedrijven.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{users?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Totaal Bedrijven</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{bedrijven?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="bedrijven" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bedrijven
            </TabsTrigger>
            <TabsTrigger value="gebruikers" className="gap-2">
              <Users className="h-4 w-4" />
              Gebruikers
            </TabsTrigger>
          </TabsList>

          {/* Bedrijven Tab */}
          <TabsContent value="bedrijven" className="space-y-6">
            {/* Detacheringbureaus */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detacheringbureaus</CardTitle>
                    <CardDescription>Bedrijven die de applicatie gebruiken</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nieuw Bureau
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detacheringbureaus.map((bureau) => (
                    <div
                      key={bureau.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all glass-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{bureau.naam}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {bureau.plaats && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {bureau.plaats}
                              </span>
                            )}
                            {bureau.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {bureau.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBedrijf(bureau.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {detacheringbureaus.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen detacheringbureaus toegevoegd
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Klantbedrijven */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Klantbedrijven</CardTitle>
                    <CardDescription>Bedrijven waar kandidaten geplaatst worden</CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nieuw Klant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {klantbedrijven.map((klant) => (
                    <div
                      key={klant.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-border/50 hover:border-border transition-all glass-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{klant.naam}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {klant.plaats && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {klant.plaats}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBedrijf(klant.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {klantbedrijven.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen klantbedrijven toegevoegd
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gebruikers Tab */}
          <TabsContent value="gebruikers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gebruikers</CardTitle>
                    <CardDescription>Alle gebruikers in het systeem</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nieuwe Gebruiker
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/20 transition-all glass-card"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {user.naam?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{user.naam}</h3>
                            <Badge className={getRoleBadgeColor(user.user_roles[0]?.role || '')}>
                              {getRoleLabel(user.user_roles[0]?.role || '')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            {user.bedrijven?.naam && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {user.bedrijven.naam}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <UserCog className="h-4 w-4" />
                        Beheren
                      </Button>
                    </div>
                  ))}
                  {(!users || users.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Geen gebruikers gevonden
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
