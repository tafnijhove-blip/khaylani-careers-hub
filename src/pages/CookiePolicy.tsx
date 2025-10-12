import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Cookie, Settings, BarChart, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Footer from "@/components/landing/Footer";

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookiebeleid - Khaylani</title>
        <meta name="description" content="Cookiebeleid van Khaylani. Informatie over hoe wij cookies gebruiken op onze website." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/cookies`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Terug naar home
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-24 pb-12 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-teal flex items-center justify-center mx-auto mb-6 shadow-glow-cyan">
              <Cookie className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cookiebeleid
            </h1>
            <p className="text-lg text-muted-foreground">
              Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="pb-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <Card className="glass-card p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {/* Wat zijn cookies */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Cookie className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Wat zijn cookies?</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Cookies zijn kleine tekstbestanden die door websites op uw apparaat (computer, tablet of telefoon) 
                        worden geplaatst wanneer u de website bezoekt. Cookies helpen websites om uw voorkeuren te onthouden 
                        en maken het mogelijk om functionaliteit te verbeteren en het websitegebruik te analyseren.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Welke cookies */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6">Welke soorten cookies gebruiken wij?</h2>

                  {/* Essentiële cookies */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-accent-cyan" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">1. Essentiële cookies (Noodzakelijk)</h3>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          Deze cookies zijn noodzakelijk voor het correct functioneren van de website. 
                          Zonder deze cookies werkt de website mogelijk niet naar behoren.
                        </p>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="font-semibold">Cookie naam:</span>
                            <span className="text-muted-foreground">session_token</span>
                            <span className="font-semibold">Doel:</span>
                            <span className="text-muted-foreground">Gebruikerssessie beheren</span>
                            <span className="font-semibold">Bewaartermijn:</span>
                            <span className="text-muted-foreground">Sessie (tot sluiten browser)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Functionele cookies */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                        <Settings className="h-6 w-6 text-accent-purple" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">2. Functionele cookies</h3>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          Deze cookies onthouden uw keuzes en voorkeuren om uw ervaring te personaliseren.
                        </p>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="font-semibold">Cookie naam:</span>
                            <span className="text-muted-foreground">language_preference</span>
                            <span className="font-semibold">Doel:</span>
                            <span className="text-muted-foreground">Taalvoorkeur opslaan</span>
                            <span className="font-semibold">Bewaartermijn:</span>
                            <span className="text-muted-foreground">1 jaar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analytische cookies */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                        <BarChart className="h-6 w-6 text-accent-teal" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">3. Analytische cookies</h3>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          Deze cookies helpen ons te begrijpen hoe bezoekers onze website gebruiken, 
                          zodat we deze kunnen verbeteren. Alle verzamelde informatie is anoniem.
                        </p>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="font-semibold">Cookie naam:</span>
                            <span className="text-muted-foreground">_ga, _gid</span>
                            <span className="font-semibold">Doel:</span>
                            <span className="text-muted-foreground">Website analyse (Google Analytics)</span>
                            <span className="font-semibold">Bewaartermijn:</span>
                            <span className="text-muted-foreground">2 jaar / 24 uur</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookies beheren */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Hoe kunt u cookies beheren?</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        U heeft altijd de controle over welke cookies u accepteert:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Via de cookie banner:</strong> Bij uw eerste bezoek kunt u kiezen welke cookies u accepteert</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Via uw browserinstellingen:</strong> De meeste browsers bieden opties om cookies te blokkeren of te verwijderen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Individuele cookies verwijderen:</strong> U kunt specifieke cookies verwijderen via uw browser</span>
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-4 italic">
                        Let op: Het uitschakelen van essentiële cookies kan de functionaliteit van de website beperken.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Browser instructies */}
                <div className="mb-12">
                  <h3 className="text-xl font-bold mb-4">Cookies beheren per browser:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="font-semibold mb-2">Google Chrome</p>
                      <p className="text-sm text-muted-foreground">Instellingen → Privacy en beveiliging → Cookies</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="font-semibold mb-2">Mozilla Firefox</p>
                      <p className="text-sm text-muted-foreground">Opties → Privacy en beveiliging → Cookies</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="font-semibold mb-2">Safari</p>
                      <p className="text-sm text-muted-foreground">Voorkeuren → Privacy → Cookies</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="font-semibold mb-2">Microsoft Edge</p>
                      <p className="text-sm text-muted-foreground">Instellingen → Cookies en sitegegevens</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Vragen over cookies?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Heeft u vragen over ons cookiebeleid? Neem gerust contact met ons op via{" "}
                    <a href="mailto:privacy@khaylani.nl" className="text-primary hover:underline">
                      privacy@khaylani.nl
                    </a>
                    {" "}of bekijk ons{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      privacybeleid
                    </Link>
                    .
                  </p>
                </div>

                {/* Wijzigingen */}
                <div className="border-t pt-8">
                  <p className="text-sm text-muted-foreground">
                    <strong>Wijzigingen in dit beleid:</strong> Wij kunnen dit cookiebeleid van tijd tot tijd bijwerken. 
                    De datum van de laatste wijziging staat bovenaan deze pagina.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;
