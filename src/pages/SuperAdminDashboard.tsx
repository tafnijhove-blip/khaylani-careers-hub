import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Trash2, Edit, Plus, UserPlus } from "lucide-react";
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
import AddCompanyDialog from "@/components/superadmin/AddCompanyDialog";
import EditCompanyDialog from "@/components/superadmin/EditCompanyDialog";
import AddUserDialog from "@/components/superadmin/AddUserDialog";
import EditUserDialog from "@/components/superadmin/EditUserDialog";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterSelect } from "@/components/search/FilterSelect";
import MapboxDashboardMap from "@/components/map/MapboxDashboardMap";
import DashboardStats from "@/components/dashboard/DashboardStats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [addCompanyType, setAddCompanyType] = useState<"detacheringbureau" | "klant">("detacheringbureau");
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "company" | "user"; id: string; name: string } | null>(null);
  
  // Search and filter states
  const [companySearch, setCompanySearch] = useState("");
  const [companyRegioFilter, setCompanyRegioFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

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
      // Fetch profiles with company info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          bedrijven:company_id(naam)
        `)
        .order("naam");
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      }));

      return usersWithRoles;
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "company") {
        const { error } = await supabase
          .from("bedrijven")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Bedrijf verwijderd",
          description: `${deleteTarget.name} is succesvol verwijderd`,
        });
        refetchBedrijven();
        refetchUsers();
      } else {
        const { error } = await supabase.auth.admin.deleteUser(deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Gebruiker verwijderd",
          description: `${deleteTarget.name} is succesvol verwijderd`,
        });
        refetchUsers();
      }
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const openDeleteDialog = (type: "company" | "user", id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleEditCompany = (company: any) => {
    setSelectedCompany(company);
    setEditCompanyDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
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
      ceo: "Manager",
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
  
  // Filter bedrijven
  const filteredDetacheringbureaus = detacheringbureaus.filter(b => {
    const matchesSearch = b.naam.toLowerCase().includes(companySearch.toLowerCase()) ||
                         (b.plaats && b.plaats.toLowerCase().includes(companySearch.toLowerCase()));
    const matchesRegio = companyRegioFilter === "all" || b.regio === companyRegioFilter;
    return matchesSearch && matchesRegio;
  });
  
  const filteredKlantbedrijven = klantbedrijven.filter(b => {
    const matchesSearch = b.naam.toLowerCase().includes(companySearch.toLowerCase()) ||
                         (b.plaats && b.plaats.toLowerCase().includes(companySearch.toLowerCase()));
    const matchesRegio = companyRegioFilter === "all" || b.regio === companyRegioFilter;
    return matchesSearch && matchesRegio;
  });
  
  // Filter users
  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.naam.toLowerCase().includes(userSearch.toLowerCase()) ||
                         u.email.toLowerCase().includes(userSearch.toLowerCase());
    const userRole = Array.isArray(u.user_roles) && u.user_roles.length > 0 
      ? (u.user_roles[0] as any)?.role 
      : null;
    const matchesRole = userRoleFilter === "all" || userRole === userRoleFilter;
    return matchesSearch && matchesRole;
  }) || [];
  
  const totalBureaus = filteredDetacheringbureaus.length;
  const totalKlanten = filteredKlantbedrijven.length;
  const totalUsers = filteredUsers.length;
  
  // Get unique regions for filter
  const uniqueRegios = [...new Set(bedrijven?.map(b => b.regio) || [])].sort();

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
            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
              <SearchBar
                value={companySearch}
                onChange={setCompanySearch}
                placeholder="Zoek op naam of plaats..."
                className="flex-1"
              />
              <FilterSelect
                value={companyRegioFilter}
                onChange={setCompanyRegioFilter}
                options={uniqueRegios.map(r => ({ value: r, label: r }))}
                placeholder="Filter op regio"
              />
            </div>

            {/* Detacheringbureaus */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Detacheringbureaus ({totalBureaus})
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setAddCompanyType("detacheringbureau");
                      setAddCompanyDialogOpen(true);
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Regio</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Gebruikers</TableHead>
                      <TableHead className="w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetacheringbureaus.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Geen bedrijven gevonden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDetacheringbureaus.map((bedrijf) => {
                      const userCount = users?.filter(u => u.company_id === bedrijf.id).length || 0;
                      return (
                        <TableRow key={bedrijf.id}>
                          <TableCell className="font-medium">{bedrijf.naam}</TableCell>
                          <TableCell>{bedrijf.regio}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {bedrijf.contactpersoon && <div>{bedrijf.contactpersoon}</div>}
                            {bedrijf.email && <div>{bedrijf.email}</div>}
                            {bedrijf.telefoon && <div>{bedrijf.telefoon}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{userCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCompany(bedrijf)}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog("company", bedrijf.id, bedrijf.naam)}
                                className="hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Klantbedrijven */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-accent-cyan" />
                    Klantbedrijven ({totalKlanten})
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setAddCompanyType("klant");
                      setAddCompanyDialogOpen(true);
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Regio</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKlantbedrijven.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Geen bedrijven gevonden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKlantbedrijven.map((bedrijf) => (
                      <TableRow key={bedrijf.id}>
                        <TableCell className="font-medium">{bedrijf.naam}</TableCell>
                        <TableCell>{bedrijf.regio}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bedrijf.contactpersoon && <div>{bedrijf.contactpersoon}</div>}
                          {bedrijf.email && <div>{bedrijf.email}</div>}
                          {bedrijf.telefoon && <div>{bedrijf.telefoon}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCompany(bedrijf)}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("company", bedrijf.id, bedrijf.naam)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gebruikers">
            {/* Search and Filter */}
            <div className="flex gap-4 items-center mb-6">
              <SearchBar
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Zoek op naam of email..."
                className="flex-1"
              />
              <FilterSelect
                value={userRoleFilter}
                onChange={setUserRoleFilter}
                options={[
                  { value: "superadmin", label: "Superadmin" },
                  { value: "ceo", label: "Manager" },
                  { value: "accountmanager", label: "Account Manager" },
                  { value: "recruiter", label: "Recruiter" },
                ]}
                placeholder="Filter op rol"
              />
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent-purple" />
                    Alle Gebruikers ({totalUsers})
                  </CardTitle>
                  <Button onClick={() => setAddUserDialogOpen(true)} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefoon</TableHead>
                      <TableHead>Bedrijf</TableHead>
                      <TableHead className="w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Geen gebruikers gevonden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.naam}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor((user.user_roles as any)?.[0]?.role || "")}>
                            {getRoleLabel((user.user_roles as any)?.[0]?.role || "")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.telefoon || "-"}
                        </TableCell>
                        <TableCell>
                          {user.bedrijven?.naam ? (
                            <Badge variant="outline">{user.bedrijven.naam}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("user", user.id, user.naam)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddCompanyDialog
        open={addCompanyDialogOpen}
        onOpenChange={setAddCompanyDialogOpen}
        type={addCompanyType}
        onSuccess={() => {
          refetchBedrijven();
        }}
      />

      <EditCompanyDialog
        open={editCompanyDialogOpen}
        onOpenChange={setEditCompanyDialogOpen}
        company={selectedCompany}
        onSuccess={() => {
          refetchBedrijven();
          setSelectedCompany(null);
        }}
      />

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={() => {
          refetchUsers();
        }}
      />

      <EditUserDialog
        open={editUserDialogOpen}
        onOpenChange={setEditUserDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          refetchUsers();
          setSelectedUser(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "company"
                ? `Alle gebruikers, vacatures en data van "${deleteTarget.name}" worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.`
                : `Gebruiker "${deleteTarget?.name}" wordt permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
