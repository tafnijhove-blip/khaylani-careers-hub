import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie, Shield, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a slight delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookieConsent", "all");
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem("cookieConsent", "necessary");
    setShowBanner(false);
  };

  const handleClose = () => {
    // Closing without action counts as declining
    localStorage.setItem("cookieConsent", "necessary");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <Card className="mx-auto max-w-4xl glass-card border-2 border-primary/20 shadow-2xl">
        <div className="p-6 md:p-8">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sluit cookie melding"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Cookie className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 id="cookie-banner-title" className="text-xl font-bold mb-2">
                We respecteren uw privacy
              </h2>
              <p id="cookie-banner-description" className="text-muted-foreground text-sm leading-relaxed">
                Wij gebruiken cookies om uw ervaring te verbeteren, verkeer te analyseren en relevante content te tonen. 
                Sommige cookies zijn essentieel voor de werking van de website.
                {showDetails && (
                  <span className="block mt-3 text-sm">
                    <strong>Essentiële cookies:</strong> Noodzakelijk voor basisfuncties zoals navigatie en authenticatie.
                    <br />
                    <strong>Analytische cookies:</strong> Helpen ons te begrijpen hoe bezoekers onze website gebruiken.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={acceptAll}
              className="flex-1 gap-2 shadow-glow"
              size="lg"
            >
              <Shield className="h-4 w-4" />
              Alle cookies accepteren
            </Button>
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Alleen noodzakelijke
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="lg"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {showDetails ? "Minder info" : "Meer info"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Meer informatie in ons{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              privacybeleid
            </Link>{" "}
            en{" "}
            <Link to="/cookies" className="text-primary hover:underline">
              cookiebeleid
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CookieBanner;
