import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { LogOut, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-khaylani-new.png";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("naam")
          .eq("id", session.user.id)
          .single();
        if (isMounted && data) {
          setUserName(data.naam);
        }
      } catch (_e) {
        // best-effort; ignore
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-gradient-glass border-b-2 border-primary/10 sticky top-0 z-50 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              to="/superadmin" 
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                  src={logo}
                  alt="Khaylani Logo"
                  className="h-10 w-auto"
                  style={{ mixBlendMode: 'multiply' }}
                />
            </Link>

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
                      {userName ? userName.charAt(0).toUpperCase() : "S"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-card border-2 border-primary/20" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-semibold leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">Superadmin</p>
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
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
};

export default SuperAdminLayout;
