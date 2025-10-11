import { Building2, Users, Briefcase, UserPlus, BarChart3, LogOut, Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const { data: profile } = useQuery({
    queryKey: ["user-profile-sidebar"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*, bedrijven:company_id(naam)")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const companyId = profile?.company_id;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd",
    });
    navigate("/auth");
  };

  const mainNavItems = [
    {
      title: "Dashboard",
      url: companyId ? `/bedrijf/${companyId}` : "/dashboard",
      icon: Building2,
      show: !permissions.isSuperAdmin,
    },
    {
      title: "Vacatures",
      url: companyId ? `/bedrijf/${companyId}/vacatures` : "/vacatures",
      icon: Briefcase,
      show: permissions.canViewVacancies && !permissions.isSuperAdmin,
    },
    {
      title: "Kandidaten",
      url: companyId ? `/bedrijf/${companyId}/kandidaten` : "/kandidaten",
      icon: UserPlus,
      show: permissions.canViewCandidates && !permissions.isSuperAdmin,
    },
    {
      title: "Analytics",
      url: companyId ? `/bedrijf/${companyId}/analytics` : "/analytics",
      icon: BarChart3,
      show: permissions.canViewAnalytics && !permissions.isSuperAdmin,
    },
  ];

  const adminNavItems = [
    {
      title: "Superadmin",
      url: "/superadmin",
      icon: Users,
      show: permissions.isSuperAdmin,
    },
  ];

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Khaylani</span>
          </div>
        )}
        {collapsed && <Building2 className="h-6 w-6 text-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        {permissions.isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavClass}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems
                    .filter((item) => item.show)
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {profile?.bedrijven && !collapsed && (
              <SidebarGroup>
                <SidebarGroupLabel>Bedrijf</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {profile.bedrijven.naam}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {profile?.naam?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.naam}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Uitloggen
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
