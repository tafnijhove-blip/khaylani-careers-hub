import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, LayoutDashboard, FileText, Users, BarChart3, Settings, LogOut, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-khaylani-new.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        // Fetch user profile
        supabase
          .from("profiles")
          .select("naam")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserName(data.naam);
          });

        // Fetch user role
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setUserRole(data?.role ?? null);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd",
    });
  };

  const baseNavItems = [
    { icon: MapPin, label: "Kaartoverzicht", path: "/dashboard" },
    ...(userRole !== 'recruiter' ? [{ icon: FileText, label: "Vacaturebeheer", path: "/vacatures" }] : []),
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];
  const navItems = userRole === 'superadmin'
    ? [{ icon: Shield, label: 'Superadmin', path: '/superadmin' }, ...baseNavItems]
    : baseNavItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-gradient-glass border-b-2 border-primary/10 sticky top-0 z-50 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img
                  src={logo}
                  alt="Khaylani Logo"
                  className="h-10 w-auto"
                  style={{ mixBlendMode: 'multiply' }}
                />
            </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Hoofdnavigatie">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 transition-all duration-300 hover:scale-105"
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-12 w-12 rounded-full hover:scale-110 transition-transform"
              aria-label="Gebruikersmenu openen"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-primary text-white text-lg font-bold">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-card border-2 border-primary/20" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-semibold leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">Account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Uitloggen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-primary/10" aria-label="Mobiele navigatie">
          <div className="flex justify-around p-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="flex-1">
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="w-full gap-1 flex-col h-auto py-3"
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
