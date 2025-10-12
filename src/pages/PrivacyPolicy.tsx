import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacybeleid - Khaylani</title>
        <meta name="description" content="Privacybeleid van Khaylani. Wij respecteren uw privacy en beschermen uw persoonlijke gegevens volgens de AVG." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/privacy`} />
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
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacybeleid
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
                {/* Introduction */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Inleiding</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Khaylani ("wij", "ons" of "onze") respecteert uw privacy en zet zich in voor de bescherming van uw persoonlijke gegevens. 
                        Dit privacybeleid legt uit hoe wij uw persoonlijke informatie verzamelen, gebruiken, delen en beschermen wanneer u onze website 
                        en diensten gebruikt. Wij voldoen aan de Algemene Verordening Gegevensbescherming (AVG).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Welke gegevens */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-6 w-6 text-accent-cyan" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welke gegevens verzamelen wij?</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Wij verzamelen verschillende soorten informatie om u de best mogelijke service te bieden:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Accountgegevens:</strong> Naam, e-mailadres, telefoonnummer, bedrijfsnaam</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Gebruiksgegevens:</strong> IP-adres, browser type, pagina's bezocht, tijd en datum van bezoek</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Vakantie- en kandidaatgegevens:</strong> Vacaturetitels, functieomschrijvingen, kandidaatinformatie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Communicatie:</strong> Berichten via ons contactformulier of e-mail</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Waarom verzamelen */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-6 w-6 text-accent-purple" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Waarom verzamelen wij deze gegevens?</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Wij gebruiken uw gegevens voor de volgende doeleinden:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Het leveren en verbeteren van onze recruitment dashboard diensten</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Accountbeheer en klantenondersteuning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Communicatie over updates, nieuwe functies en relevante informatie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Analyseren en optimaliseren van gebruikservaringen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Voldoen aan wettelijke verplichtingen</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Delen van gegevens */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-6 w-6 text-accent-teal" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Delen wij uw gegevens?</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Wij verkopen of verhuren uw persoonlijke gegevens <strong>nooit</strong> aan derden. 
                        Wij delen uw gegevens alleen in de volgende gevallen:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Service providers:</strong> Betrouwbare partners die ons helpen bij hosting, analytics en klantenondersteuning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Wettelijke verplichting:</strong> Wanneer dit wettelijk verplicht is of om onze rechten te beschermen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Met uw toestemming:</strong> In alle andere gevallen vragen wij eerst uw expliciete toestemming</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Beveiliging */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Hoe beveiligen wij uw gegevens?</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Wij nemen de beveiliging van uw gegevens zeer serieus en implementeren verschillende maatregelen:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>SSL/TLS encryptie:</strong> Alle gegevensoverdracht is versleuteld</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Toegangscontrole:</strong> Alleen geautoriseerd personeel heeft toegang tot persoonlijke gegevens</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Datacenters in EU:</strong> Uw gegevens worden opgeslagen in beveiligde datacenters binnen de Europese Unie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Regelmatige audits:</strong> Wij voeren regelmatig beveiligingsaudits uit</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Uw rechten */}
                <div className="mb-12">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-6 w-6 text-accent-cyan" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Uw rechten onder de AVG</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        U heeft verschillende rechten met betrekking tot uw persoonlijke gegevens:
                      </p>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u bewaren</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Recht op rectificatie:</strong> U kunt vragen om onjuiste gegevens te corrigeren</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Recht op verwijdering:</strong> U kunt vragen om uw gegevens te verwijderen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Recht op dataportabiliteit:</strong> U kunt uw gegevens in een leesbaar formaat opvragen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Recht op bezwaar:</strong> U kunt bezwaar maken tegen de verwerking van uw gegevens</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="mb-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-accent-purple" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Contact opnemen</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Voor vragen over dit privacybeleid of om uw rechten uit te oefenen, kunt u contact met ons opnemen:
                      </p>
                      <div className="space-y-2 text-muted-foreground">
                        <p><strong>E-mail:</strong> <a href="mailto:privacy@khaylani.nl" className="text-primary hover:underline">privacy@khaylani.nl</a></p>
                        <p><strong>Algemeen:</strong> <a href="mailto:info@khaylani.nl" className="text-primary hover:underline">info@khaylani.nl</a></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wijzigingen */}
                <div className="border-t pt-8">
                  <p className="text-sm text-muted-foreground">
                    <strong>Wijzigingen in dit beleid:</strong> Wij behouden ons het recht voor om dit privacybeleid 
                    te wijzigen. Belangrijke wijzigingen zullen wij u tijdig meedelen via e-mail of een melding op onze website.
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

export default PrivacyPolicy;
