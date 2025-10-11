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
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import logoImage from "@/assets/logo-khaylani.png";
import DashboardPreview from "@/components/landing/DashboardPreview";
import LandingMapWithData from "@/components/landing/LandingMapWithData";
import VacaturePreview from "@/components/landing/VacaturePreview";
import Footer from "@/components/landing/Footer";
import { contactFormSchema } from "@/lib/validationSchemas";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
    bericht: ""
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
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
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
        bericht: ""
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
    { value: "24/7", label: "Sales & recruiters in sync", icon: Zap }
  ];

  const benefits = [
    { 
      icon: MapPin, 
      title: "Sales ziet waar recruiters bezig zijn", 
      description: "Geen gezeik meer over 'wat doet jouw team eigenlijk?'. Elke regio, elke vacature, direct zichtbaar."
    },
    { 
      icon: Clock, 
      title: "Recruiters zien live wat sales binnenhaalt", 
      description: "Nieuwe klant? Recruiter weet het meteen. Kandidaat geplaatst? Sales ziet het direct. Échte samenwerking."
    },
    { 
      icon: Users, 
      title: "Managers weten precies waar de omzet zit", 
      description: "Stop met raden. Zie exact welke regio's, klanten en recruiters presteren. Data die telt."
    },
    { 
      icon: BarChart3, 
      title: "Minder meetings, meer doen", 
      description: "Je team werkt uit hetzelfde systeem. Iedereen weet wat er speelt. 30% minder overhead, direct meetbaar."
    }
  ];

  const testimonials = [
    {
      quote: "Khaylani heeft onze recruitment workflow gerevolutioneerd. We besparen nu 30% tijd op administratie en hebben eindelijk realtime inzicht in alle vacatures.",
      author: "Mark van der Berg",
      role: "Manager",
      company: "TechTalent Detachering"
    },
    {
      quote: "De geografische kaart is een gamechanger. We kunnen nu direct zien waar de meeste vraag is en onze recruiters daar naartoe sturen.",
      author: "Sarah Jansen",
      role: "Recruitment Manager",
      company: "FlexForce Nederland"
    },
    {
      quote: "Onze recruiters zijn veel productiever sinds we Khaylani gebruiken. Alles in één overzicht, geen gezoek meer in verschillende systemen.",
      author: "Peter de Vries",
      role: "Operations Director",
      company: "ProStaff Solutions"
    }
  ];

  const faqs = [
    {
      question: "Hoe snel kan ik starten met Khaylani?",
      answer: "Na je offerte aanvraag ontvang je binnen 24 uur een persoonlijk voorstel. Na akkoord kun je binnen 48 uur live gaan met onboarding en training."
    },
    {
      question: "Werkt Khaylani ook met mijn bestaande systemen?",
      answer: "Ja, Khaylani integreert met de meeste HR- en ATS-systemen. We bieden API-koppelingen en kunnen data importeren vanuit Excel/CSV."
    },
    {
      question: "Hoeveel gebruikers kan ik toevoegen?",
      answer: "Onbeperkt. Je betaalt per bedrijf, niet per gebruiker. Ideaal voor groeiende teams."
    },
    {
      question: "Is mijn data veilig?",
      answer: "Absoluut. We werken met enterprise-grade beveiliging, SSL-encryptie en voldoen aan AVG-wetgeving. Data wordt opgeslagen in EU datacenters."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Khaylani - Recruitment Dashboard voor Detacheringsbureaus | Realtime Vacature Inzicht</title>
        <meta name="description" content="Khaylani biedt detacheringsbureaus realtime inzicht in vacatures en recruitment data. Centraliseer je vacatures, monitor recruiter-activiteit en optimaliseer je plaatsingen met smart analytics." />
        <meta name="keywords" content="recruitment dashboard, detachering software, vacature management, recruitment data, HR analytics, recruiter tool" />
        <meta property="og:title" content="Khaylani - Recruitment Dashboard voor Detacheringsbureaus" />
        <meta property="og:description" content="Realtime inzicht in je recruitment data. Bespaar 30% tijd en plaats sneller." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className={`fixed top-0 w-full z-50 glass-card border-b transition-all duration-300 ${showStickyNav ? 'shadow-lg' : ''}`}>
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logoImage} alt="Khaylani Logo - Recruitment Dashboard" className="h-8 w-auto transition-transform group-hover:scale-105" />
              <span className="text-xl font-bold text-gradient">Khaylani</span>
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
                  Gratis offerte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-animated opacity-30" />
          <div className="cyber-grid absolute inset-0 opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          
          {/* Floating orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          <main className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8 animate-fade-in">
              <Badge variant="secondary" className="mb-4 text-sm py-2 px-4">
                <Zap className="h-4 w-4 mr-2 inline" />
                Trusted by 50+ recruitment bureaus
              </Badge>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                Recruiters en sales,{" "}
                <span className="text-gradient animate-shimmer bg-[length:200%_100%]">
                  eindelijk gesynchroniseerd
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stop met mailen en bellen. Geef je recruiters en accountmanagers <strong>direct inzicht</strong> in elkaars werk. 
                Managers zien real-time waar de omzet zit. Sneller schakelen = sneller plaatsen.
              </p>
              

              <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Real-time synchronisatie</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Geografisch inzicht</span>
                </div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Minder meetings, meer doen</span>
                </div>
              </div>
            </div>

            {/* Map Preview - Geografisch overzicht */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-4">
                  <MapPin className="h-4 w-4 mr-2 inline" />
                  Live Tracking
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Waar zitten je kansen? <span className="text-gradient">Zie het in 3 seconden</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Stuur je recruiters naar de hotspots. Sales ziet direct waar ze moeten bellen. Managers zien de spread.
                </p>
              </div>
              <LandingMapWithData />
            </div>

            <a href="#vacatures" className="flex justify-center mt-12 animate-bounce">
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </main>
        </section>

        {/* Vacature Preview Section */}
        <section id="vacatures" className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">Vacature Sync</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Iedereen weet <span className="text-gradient">exact wat er speelt</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Accountmanager belt klant? Recruiter ziet het. Kandidaat op gesprek? Sales weet het. Geen verrassingen meer.
              </p>
            </div>
            <VacaturePreview />
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="dashboard" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">Manager Dashboard</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Eindelijk weten <span className="text-gradient">wat er echt gebeurt</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Zie in één blik welke recruiters draaien, waar je omzet zit en waar je moet bijsturen. No bullshit.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center space-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <Badge variant="secondary" className="mb-2">Waarom Khaylani?</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Sneller schakelen = <span className="text-gradient">sneller plaatsen</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Minder vergaderingen, minder mails, minder gedoe. Meer transparantie tussen recruiters, sales én management.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className="glass-card p-8 hover-lift group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-all group-hover:scale-110">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Testimonials</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Wat onze klanten zeggen
              </h2>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground">4.9/5 gemiddelde beoordeling van 50+ klanten</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="glass-card p-8 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary font-medium">{testimonial.company}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Veelgestelde vragen
              </h2>
              <p className="text-xl text-muted-foreground">
                Alles wat je moet weten over Khaylani
              </p>
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
              <h2 className="text-4xl md:text-5xl font-bold">
                Start vandaag nog met Khaylani
              </h2>
              <p className="text-xl text-muted-foreground">
                Binnen <strong>24 uur</strong> ontvang je een persoonlijk voorstel op maat
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
                      className={`h-12 ${formErrors.naam ? 'border-destructive' : ''}`}
                    />
                    {formErrors.naam && (
                      <p className="text-sm text-destructive">{formErrors.naam}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
                    <Input
                      id="bedrijfsnaam"
                      required
                      value={formData.bedrijfsnaam}
                      onChange={(e) => setFormData({ ...formData, bedrijfsnaam: e.target.value })}
                      placeholder="Naam van je bedrijf"
                      className={`h-12 ${formErrors.bedrijfsnaam ? 'border-destructive' : ''}`}
                    />
                    {formErrors.bedrijfsnaam && (
                      <p className="text-sm text-destructive">{formErrors.bedrijfsnaam}</p>
                    )}
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
                    className={`h-12 ${formErrors.email ? 'border-destructive' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aantalMedewerkers">Hoeveel gebruikers krijgen toegang tot Khaylani? *</Label>
                  <Input
                    id="aantalMedewerkers"
                    required
                    value={formData.aantalMedewerkers}
                    onChange={(e) => setFormData({ ...formData, aantalMedewerkers: e.target.value })}
                    placeholder="Bijvoorbeeld: 5 recruiters, 2 accountmanagers, 1 manager"
                    className={`h-12 ${formErrors.aantalMedewerkers ? 'border-destructive' : ''}`}
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
                    className={formErrors.bericht ? 'border-destructive' : ''}
                  />
                  {formErrors.bericht && (
                    <p className="text-sm text-destructive">{formErrors.bericht}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full gap-2 h-14 text-lg" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      Vraag gratis offerte aan
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
      </div>
    </>
  );
};

export default Index;
