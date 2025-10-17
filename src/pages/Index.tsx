"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  TrendingUp,
  Users,
  MapPin,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Linkedin,
  Mail,
  Shield,
  Zap,
  Target,
  Star,
  Award,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

import DashboardPreview from "@/components/landing/DashboardPreview";
import DemoJobMap from "@/components/landing/DemoJobMap";
import VacaturePreview from "@/components/landing/VacaturePreview";
import Footer from "@/components/landing/Footer";
import CookieBanner from "@/components/CookieBanner";
import { contactFormSchema } from "@/lib/validationSchemas";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo-khaylani-new.png";

const Index = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    naam: "",
    bedrijfsnaam: "",
    email: "",
    aantalMedewerkers: "",
    bericht: "",
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyNav(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validated = contactFormSchema.parse(formData);

      // Call edge function to send emails
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: validated,
      });

      if (error) throw error;

      toast({
        title: "Offerte aangevraagd! ✅",
        description: "Binnen 24 uur nemen we contact met je op met een persoonlijk voorstel.",
      });

      setFormData({
        naam: "",
        bedrijfsnaam: "",
        email: "",
        aantalMedewerkers: "",
        bericht: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
        toast({
          title: "Formulier bevat fouten",
          description: "Controleer de velden en probeer opnieuw.",
          variant: "destructive",
        });
      } else {
        console.error("Error submitting form:", error);
        toast({
          title: "Er ging iets mis",
          description: "Probeer het later opnieuw of mail ons op info@khaylani.nl",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { value: "500+", label: "Actieve vacatures gesynchroniseerd", icon: Target },
    { value: "50+", label: "Bureaus die sneller plaatsen", icon: Award },
    { value: "30%", label: "Minder overhead meetings", icon: Clock },
    { value: "24/7", label: "Sales & recruiters in sync", icon: Zap },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Iedereen weet exact wat er speelt",
      description:
        "Accountmanager heeft een nieuwe aanvraag? Recruiter ziet het direct in het systeem. Van functie-eisen tot details over het bedrijf: de recruiter weet precies wat hij moet zoeken. Geen onnodige meetings meer tussen accountmanagers en recruiters over vacatures.",
    },
    {
      icon: Clock,
      title: "Recruiters zien live wat sales binnenhaalt",
      description:
        "Nieuwe klant? Recruiter weet het meteen. Nieuwe vacature bij een bedrijf? Recruiter weet direct tot in detail wat hij of zij moet zoeken.",
      subdescription:
        "Maak het visueel duidelijk aan kandidaten waar je actief bent en toon betrokkenheid. Recruiters weten exact waar vacatures openstaan en kunnen tijdens een intake concrete voorstellen doen. Zo voelt de kandidaat zich serieus genomen en krijgt hij het vertrouwen dat jullie hem of haar écht helpen aan die perfecte baan.",
    },
    {
      icon: BarChart3,
      title: "Managers weten precies hoe en waar ze hun team moeten bijsturen",
      description: "Zie in één oogopslag waar je team actief is en waar de kansen liggen, zodat je doelgericht kunt bijsturen waar dat nodig is.",
    },
    {
      icon: Target,
      title: "Minder meetings, meer doen",
      description:
        "Elk uur dat een recruiter en accountmanager minder in overleg zitten, is een uur meer om geschikte kandidaten te vinden. Tijd is kostbaar — en Khaylani bespaart tijd, zodat je kunt focussen op wat écht belangrijk is.",
    },
  ];


  const faqs = [
    {
      question: "Werkt Khaylani ook met mijn bestaande systemen?",
      answer:
        "Ja, Khaylani integreert met de meeste HR- en ATS-systemen. We bieden API-koppelingen en kunnen data importeren vanuit Excel of CSV.",
    },
    {
      question: "Hoe snel kan ik starten met Khaylani?",
      answer:
        "Na je offerteaanvraag ontvang je binnen 24 uur een persoonlijk voorstel. Na akkoord plannen we een meeting in om de onboarding op maat te bespreken.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Khaylani - Recruitment Dashboard voor Detacheringsbureaus | Realtime Vacature Inzicht</title>
        <meta
          name="description"
          content="Khaylani biedt detacheringsbureaus realtime inzicht in vacatures en recruitment data. Centraliseer je vacatures, monitor recruiter-activiteit en optimaliseer je plaatsingen met smart analytics."
        />
        <meta
          name="keywords"
          content="recruitment dashboard, detachering software, vacature management, recruitment data, HR analytics, recruiter tool"
        />
        <meta property="og:title" content="Khaylani - Recruitment Dashboard voor Detacheringsbureaus" />
        <meta
          property="og:description"
          content="Realtime inzicht in je recruitment data. Bespaar 30% tijd en plaats sneller."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav
          className={`fixed top-0 w-full z-50 glass-card border-b transition-all duration-300 ${showStickyNav ? "shadow-lg" : "shadow-sm"}`}
        >
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
              <img 
                src={logo} 
                alt="Khaylani Careers Hub Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Inloggen
                </Button>
              </Link>
              <a href="#offerte">
                <Button size="sm" className="gap-2">
                  Offerte Aanvragen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-36 pb-24 px-6 overflow-hidden">
          {/* Subtle background effects */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />

          {/* Floating orbs - more subtle */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-20 right-10 w-[32rem] h-[32rem] bg-secondary/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          />

          <main className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8 animate-fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                Versnel je <span className="text-gradient">recruitmentproces</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Werk samen vanuit één platform met realtime inzicht in klanten, vacatures en resultaten. Minder overleg, meer plaatsingen.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Realtime synchronisatie</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Geografisch overzicht</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Direct inzetbaar</span>
                </div>
              </div>

              <div className="pt-8">
                <a href="#offerte">
                  <Button size="lg" className="gap-2 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all rounded-xl">
                    Versnel nu jouw recruitmentproces
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Feature Text + Demo Job Map */}
            <div className="mt-24 space-y-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-center space-y-4 max-w-4xl mx-auto">
                <Badge variant="secondary" className="mb-2">
                  Realtime Inzicht
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Krijg direct inzicht in waar je klanten en vacatures actief zijn, en ontdek waar de <span className="text-gradient">grootste kansen</span> liggen
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Interactieve kaart met realtime vacaturedata per regio.
                </p>
                <p className="text-sm text-muted-foreground/80 pt-2">
                  Bekijk waar jij het verschil kunt maken
                </p>
              </div>
              
              <DemoJobMap />
            </div>

            <a href="#vacatures" className="flex justify-center mt-16 animate-bounce">
              <ChevronDown className="h-8 w-8 text-muted-foreground opacity-50" />
            </a>
          </main>
        </section>

        {/* Vacature Preview Section */}
        <section id="vacatures" className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">
                Realtime Inzicht
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Realtime inzicht – <span className="text-gradient">alles in één overzicht</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Zie in één oogopslag waar je klanten en vacatures zitten, en welke kandidaten je moet zoeken. Recruiters hebben alle informatie direct in het systeem, zodat onnodige meetings met accountmanagers overbodig zijn. Interactieve realtime kaart per regio houdt alles overzichtelijk.
              </p>
              <p className="text-sm text-muted-foreground/80 pt-2">
                Bekijk je kansen in realtime
              </p>
            </div>
            <VacaturePreview />
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="dashboard" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">
                Manager Dashboard
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Manager Dashboard – <span className="text-gradient">stuur je team met inzicht</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Zie precies waar je team actief is, waar de kansen liggen en waar je moet ingrijpen. Alle informatie direct beschikbaar, zodat je tijd bespaart en resultaten verbetert.
              </p>
              <p className="text-sm text-muted-foreground/80 pt-2">
                Bekijk je team in realtime
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center space-y-3 animate-fade-in hover-lift p-6 rounded-xl bg-card/50 border shadow-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <Badge variant="secondary" className="mb-2 shadow-sm">
                Waarom Khaylani?
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Sneller schakelen = <span className="text-gradient">sneller plaatsen</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Minder vergaderingen, minder mails, minder gedoe. Meer transparantie tussen recruiters, sales én
                management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="glass-card p-8 hover-lift group animate-fade-in border"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 shadow-md group-hover:shadow-lg transition-all">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  {'subdescription' in benefit && (
                    <p className="text-muted-foreground/80 text-sm leading-relaxed mt-4 pt-4 border-t">
                      {benefit.subdescription}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Veelgestelde vragen</h2>
              <p className="text-xl text-muted-foreground">Alles wat je moet weten over Khaylani</p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="glass-card p-8 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Offerte Form */}
        <section id="offerte" className="py-24 px-6 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">
                <Clock className="h-4 w-4 mr-2 inline" />
                Snelle response
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Start vandaag nog met Khaylani</h2>
              <p className="text-xl text-muted-foreground">
                Binnen <strong>24 uur</strong> ontvang je een voorstel op maat
              </p>
            </div>

            <Card className="glass-card p-8 shadow-2xl border-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="naam">Naam *</Label>
                    <Input
                      id="naam"
                      required
                      value={formData.naam}
                      onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                      placeholder="Je volledige naam"
                      className={`h-12 ${formErrors.naam ? "border-destructive" : ""}`}
                    />
                    {formErrors.naam && <p className="text-sm text-destructive">{formErrors.naam}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
                    <Input
                      id="bedrijfsnaam"
                      required
                      value={formData.bedrijfsnaam}
                      onChange={(e) => setFormData({ ...formData, bedrijfsnaam: e.target.value })}
                      placeholder="Naam van je bedrijf"
                      className={`h-12 ${formErrors.bedrijfsnaam ? "border-destructive" : ""}`}
                    />
                    {formErrors.bedrijfsnaam && <p className="text-sm text-destructive">{formErrors.bedrijfsnaam}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mailadres *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="je@bedrijf.nl"
                    className={`h-12 ${formErrors.email ? "border-destructive" : ""}`}
                  />
                  {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aantalMedewerkers">Hoeveel gebruikers krijgen toegang tot Khaylani? *</Label>
                  <Input
                    id="aantalMedewerkers"
                    required
                    value={formData.aantalMedewerkers}
                    onChange={(e) => setFormData({ ...formData, aantalMedewerkers: e.target.value })}
                    placeholder="Bijvoorbeeld: 5 recruiters, 2 accountmanagers, 1 manager"
                    className={`h-12 ${formErrors.aantalMedewerkers ? "border-destructive" : ""}`}
                  />
                  {formErrors.aantalMedewerkers && (
                    <p className="text-sm text-destructive">{formErrors.aantalMedewerkers}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bericht">Eventuele vragen of opmerkingen *</Label>
                  <Textarea
                    id="bericht"
                    required
                    value={formData.bericht}
                    onChange={(e) => setFormData({ ...formData, bericht: e.target.value })}
                    placeholder="Vertel ons meer over je situatie..."
                    rows={4}
                    className={formErrors.bericht ? "border-destructive" : ""}
                  />
                  {formErrors.bericht && <p className="text-sm text-destructive">{formErrors.bericht}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 h-14 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      Vraag een gratis offerte aan
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>100% vrijblijvend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Response binnen 24u</span>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <Footer />

        {/* Cookie Banner - GDPR Compliant */}
        <CookieBanner />
      </div>
    </>
  );
};

export default Index;
