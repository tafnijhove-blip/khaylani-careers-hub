import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, MapPin, Users, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo-khaylani-new.png";

const Auth = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    const checkUserAndRedirect = async (session: any) => {
      if (!session) return;

      // Hardcoded superadmin fast-path by email
      const email = session.user.email?.toLowerCase();
      if (email === 'tafnijhove@gmail.com') {
        navigate("/superadmin");
        return;
      }

      // Fetch user role (non-superadmin)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const role = roleData?.role;

      // Redirect based on role
      if (role === 'superadmin') {
        navigate("/superadmin");
        return;
      }

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
    };
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
          <Link to="/" className="flex items-center mb-8 hover:opacity-90 transition-opacity">
            <img 
              src={logo} 
              alt="Khaylani Logo" 
              className="h-16 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <p className="text-xl text-white/90 max-w-md">
            {t('auth.branding.tagline')}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <Building2 className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">{t('auth.feature.companies')}</h3>
            <p className="text-white/80 text-sm">{t('auth.feature.companies.desc')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <Users className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">{t('auth.feature.vacancies')}</h3>
            <p className="text-white/80 text-sm">{t('auth.feature.vacancies.desc')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <TrendingUp className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">{t('auth.feature.analytics')}</h3>
            <p className="text-white/80 text-sm">{t('auth.feature.analytics.desc')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <MapPin className="h-8 w-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">{t('auth.feature.map')}</h3>
            <p className="text-white/80 text-sm">{t('auth.feature.map.desc')}</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center mb-4 hover:opacity-90 transition-opacity">
              <img 
                src={logo} 
                alt="Khaylani Logo" 
                className="h-12 w-auto mx-auto"
                style={{ mixBlendMode: 'multiply' }}
              />
            </Link>
          </div>

          <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
            <h2 className="text-2xl font-bold mb-2 text-card-foreground">{t('auth.welcome')}</h2>
            <p className="text-muted-foreground mb-6">{t('auth.subtitle')}</p>
            
            <SupabaseAuth
              supabaseClient={supabase}
              view="sign_in"
              showLinks={false}
              localization={{
                variables: {
                  sign_in: {
                    email_label: language === 'nl' ? 'E-mailadres' : 'Email address',
                    password_label: language === 'nl' ? 'Wachtwoord' : 'Password',
                    email_input_placeholder: language === 'nl' ? 'Jouw e-mailadres' : 'Your email address',
                    password_input_placeholder: language === 'nl' ? 'Jouw wachtwoord' : 'Your password',
                    button_label: language === 'nl' ? 'Inloggen' : 'Sign in',
                    loading_button_label: language === 'nl' ? 'Inloggen...' : 'Signing in ...',
                    social_provider_text: language === 'nl' ? 'Inloggen met {{provider}}' : 'Sign in with {{provider}}',
                    link_text: language === 'nl' ? 'Heb je al een account? Inloggen' : 'Already have an account? Sign in',
                  },
                },
              }}
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
            {t('auth.terms')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
