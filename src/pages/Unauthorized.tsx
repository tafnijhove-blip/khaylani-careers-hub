import { Helmet } from "react-helmet";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

const Unauthorized = () => {
  const { isSuperAdmin, isManager, isAccountManager, isRecruiter } = usePermissions();
  const location = useLocation();

  const destination = isSuperAdmin
    ? "/superadmin"
    : isManager
    ? "/manager"
    : isAccountManager
    ? "/accountmanager"
    : isRecruiter
    ? "/recruiter"
    : "/dashboard";

  return (
    <>
      <Helmet>
        <title>Geen toegang | Khaylani</title>
        <meta name="description" content="Toegang geweigerd: je hebt onvoldoende rechten om deze pagina te bekijken." />
        <link rel="canonical" href={`${window.location.origin}/unauthorized`} />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="max-w-md w-full bg-card border rounded-lg p-6 text-center shadow-md">
          <h1 className="text-2xl font-semibold mb-2">Geen toegang</h1>
          <p className="text-muted-foreground mb-6">
            Je hebt onvoldoende rechten om deze pagina te bekijken.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link to={destination}>Ga naar je dashboard</Link>
            </Button>
            {location.state?.from && (
              <Button asChild variant="outline">
                <Link to="/">Terug naar start</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Unauthorized;
