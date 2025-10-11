import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Trash2, UserPlus } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SuperAdminDashboard = () => {
  const { toast } = useToast();

  // Fetch all companies
  const { data: bedrijven, isLoading: bedrijvenLoading, refetch: refetchBedrijven } = useQuery({
    queryKey: ["bedrijven-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bedrijven")
        .select("*")
        .order("naam");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all users with their roles and company info
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["users-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role),
          bedrijven:company_id(naam)
        `)
        .order("naam");
      if (error) throw error;
      return data;
    },
  });

  const handleDeleteBedrijf = async (bedrijfId: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?\n\nAlle gebruikers, vacatures en data van dit bedrijf worden permanent verwijderd.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("bedrijven")
        .delete()
        .eq("id", bedrijfId);

      if (error) throw error;

      toast({
        title: "Bedrijf verwijderd",
        description: `${naam} is succesvol verwijderd`,
      });
      refetchBedrijven();
      refetchUsers();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "ceo":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "accountmanager":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "recruiter":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: "Superadmin",
      ceo: "CEO",
      accountmanager: "Account Manager",
      recruiter: "Recruiter",
    };
    return labels[role] || role;
  };

  if (bedrijvenLoading || usersLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Dashboard laden..." />
        </div>
      </SuperAdminLayout>
    );
  }

  const detacheringbureaus = bedrijven?.filter(b => b.type === "detacheringbureau") || [];
  const klantbedrijven = bedrijven?.filter(b => b.type === "klant") || [];
  const totalBureaus = detacheringbureaus.length;
  const totalKlanten = klantbedrijven.length;
  const totalUsers = users?.length || 0;

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Superadmin Dashboard</h1>
          <p className="text-muted-foreground text-lg">Beheer alle bedrijven en gebruikers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Detacheringbureaus</CardTitle>
              <Building2 className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient">{totalBureaus}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Klantbedrijven</CardTitle>
              <Building2 className="h-8 w-8 text-accent-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent-cyan">{totalKlanten}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Gebruikers</CardTitle>
              <Users className="h-8 w-8 text-accent-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent-purple">{totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bedrijven" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="bedrijven">Bedrijven</TabsTrigger>
            <TabsTrigger value="gebruikers">Gebruikers</TabsTrigger>
          </TabsList>

          <TabsContent value="bedrijven" className="space-y-6">
            {/* Detacheringbureaus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Detacheringbureaus ({totalBureaus})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Regio</TableHead>
                      <TableHead>Gebruikers</TableHead>
                      <TableHead>Vacatures</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detacheringbureaus.map((bedrijf) => {
                      const userCount = users?.filter(u => u.company_id === bedrijf.id).length || 0;
                      return (
                        <TableRow key={bedrijf.id}>
                          <TableCell className="font-medium">{bedrijf.naam}</TableCell>
                          <TableCell>{bedrijf.regio}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{userCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">-</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBedrijf(bedrijf.id, bedrijf.naam)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Klantbedrijven */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent-cyan" />
                  Klantbedrijven ({totalKlanten})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Regio</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {klantbedrijven.map((bedrijf) => (
                      <TableRow key={bedrijf.id}>
                        <TableCell className="font-medium">{bedrijf.naam}</TableCell>
                        <TableCell>{bedrijf.regio}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBedrijf(bedrijf.id, bedrijf.naam)}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gebruikers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent-purple" />
                  Alle Gebruikers ({totalUsers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Bedrijf</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.naam}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.user_roles?.[0]?.role || "")}>
                            {getRoleLabel(user.user_roles?.[0]?.role || "")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          {user.bedrijven?.naam ? (
                            <Badge variant="outline">{user.bedrijven.naam}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Beheren
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
