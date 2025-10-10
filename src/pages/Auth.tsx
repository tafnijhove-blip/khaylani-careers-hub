import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Users, TrendingUp } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async (session: any) => {
      if (!session) return;

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      const role = roleData?.role;

      // Redirect based on role
      if (role === 'superadmin') {
        navigate("/superadmin");
      } else {
        // For other roles, fetch company_id and redirect to company dashboard
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', session.user.id)
          .single();

        if (profileData?.company_id) {
          navigate(`/bedrijf/${profileData.company_id}`);
        } else {
          navigate("/dashboard");
        }
      }
    };

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserAndRedirect(session);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUserAndRedirect(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djEwaC0xMFYxNmgxMHptLTIgMmgtNnY2aDZ2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl shadow-glow">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Khaylani</h1>
          </div>
          <p className="text-xl text-white/90 max-w-md">
            Professionele vacaturekaart voor detacheringsbureaus
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <Building2 className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Bedrijven Beheren</h3>
            <p className="text-white/80 text-sm">Centraal overzicht van alle klanten</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <Users className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Vacatures Tracken</h3>
            <p className="text-white/80 text-sm">Real-time status per regio</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <TrendingUp className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Analytics Dashboard</h3>
            <p className="text-white/80 text-sm">Inzicht in trends en KPI's</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <MapPin className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Interactieve Kaart</h3>
            <p className="text-white/80 text-sm">Visueel overzicht Nederland</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Khaylani</h1>
            </div>
          </div>

          <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
            <h2 className="text-2xl font-bold mb-2 text-card-foreground">Welkom terug</h2>
            <p className="text-muted-foreground mb-6">Log in op je account of maak een nieuw account aan</p>
            
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "hsl(217 91% 60%)",
                      brandAccent: "hsl(221 83% 53%)",
                      brandButtonText: "white",
                      defaultButtonBackground: "white",
                      defaultButtonBackgroundHover: "hsl(214 32% 91%)",
                      inputBackground: "white",
                      inputBorder: "hsl(214 32% 91%)",
                      inputBorderHover: "hsl(217 91% 60%)",
                      inputBorderFocus: "hsl(217 91% 60%)",
                    },
                    radii: {
                      borderRadiusButton: "1rem",
                      buttonBorderRadius: "1rem",
                      inputBorderRadius: "0.75rem",
                    },
                  },
                },
                className: {
                  container: "space-y-4",
                  button: "font-medium transition-all duration-300 hover:shadow-md",
                  input: "transition-all duration-300",
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/dashboard`}
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Door in te loggen ga je akkoord met onze voorwaarden
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
