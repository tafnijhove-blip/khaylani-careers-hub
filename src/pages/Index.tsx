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
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import logoImage from "@/assets/logo-khaylani.png";
import DashboardPreview from "@/components/landing/DashboardPreview";
import MapPreview from "@/components/landing/MapPreview";
import VacaturePreview from "@/components/landing/VacaturePreview";

const Index = () => {
  const { toast } = useToast();
  const [showStickyNav, setShowStickyNav] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const stats = [
    { value: "500+", label: "Actieve vacatures", icon: Target },
    { value: "50+", label: "Tevreden klanten", icon: Award },
    { value: "30%", label: "Tijdsbesparing", icon: Clock },
    { value: "24/7", label: "Realtime inzicht", icon: Zap }
  ];

  const benefits = [
    { 
      icon: MapPin, 
      title: "Geografisch overzicht", 
      description: "Zie in één oogopslag waar al je vacatures openstaan en identificeer nieuwe kansen per regio."
    },
    { 
      icon: Clock, 
      title: "Realtime updates", 
      description: "Monitor live de status van elke vacature en recruiter-activiteit voor directe beslissingen."
    },
    { 
      icon: Users, 
      title: "Team management", 
      description: "Voeg eenvoudig nieuwe recruiters toe en beheer toegangsrechten per bedrijf of regio."
    },
    { 
      icon: BarChart3, 
      title: "Smart analytics", 
      description: "Automatische rapportages met KPI's, trends en voorspellingen om je strategie te optimaliseren."
    }
  ];

  const testimonials = [
    {
      quote: "Khaylani heeft onze recruitment workflow gerevolutioneerd. We besparen nu 30% tijd op administratie en hebben eindelijk realtime inzicht in alle vacatures.",
      author: "Mark van der Berg",
      role: "CEO",
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
          <div className="cyber-grid absolute inset-0 opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          
          <main className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8 animate-fade-in">
              <Badge variant="secondary" className="mb-4 text-sm py-2 px-4">
                <Zap className="h-4 w-4 mr-2 inline" />
                Trusted by 50+ recruitment bureaus
              </Badge>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                Maak je recruitmentdata{" "}
                <span className="text-gradient animate-shimmer bg-[length:200%_100%]">
                  inzichtelijk
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Het enige dashboard dat je nodig hebt. Ontdek waar je vacatures openstaan, 
                welke bedrijven actief zijn en geef je recruiters <strong>directe toegang</strong> tot realtime inzichten.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <a href="#offerte">
                  <Button size="lg" className="gap-2 hover-lift text-lg px-8 py-6">
                    Start gratis trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="hover-lift text-lg px-8 py-6">
                    Bekijk demo
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Geen creditcard nodig</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Setup in 5 minuten</span>
                </div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview - Real Component */}
            <div className="mt-20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <DashboardPreview />
            </div>

            <a href="#features" className="flex justify-center mt-12 animate-bounce">
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </main>
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

        {/* Map Preview Section */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">Live Tracking</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Geografisch <span className="text-gradient">vacature-overzicht</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Zie in één oogopslag waar je vacatures openstaan en identificeer nieuwe kansen per regio.
              </p>
            </div>
            <MapPreview />
          </div>
        </section>

        {/* Vacature Preview Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="secondary" className="mb-2">Vacature Management</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Beheer al je <span className="text-gradient">vacatures</span> centraal
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Van intake tot plaatsing - volg elke stap in het recruitmentproces.
              </p>
            </div>
            <VacaturePreview />
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <Badge variant="secondary" className="mb-2">Features</Badge>
              <h2 className="text-4xl md:text-6xl font-bold">
                Alles wat je nodig hebt, <span className="text-gradient">in één dashboard</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Khaylani centraliseert je volledige recruitment workflow en geeft je het inzicht dat je nodig hebt om sneller te plaatsen.
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
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
                    <Input
                      id="bedrijfsnaam"
                      required
                      value={formData.bedrijfsnaam}
                      onChange={(e) => setFormData({ ...formData, bedrijfsnaam: e.target.value })}
                      placeholder="Naam van je bedrijf"
                      className="h-12"
                    />
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
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aantalMedewerkers">Aantal recruiters</Label>
                  <Input
                    id="aantalMedewerkers"
                    value={formData.aantalMedewerkers}
                    onChange={(e) => setFormData({ ...formData, aantalMedewerkers: e.target.value })}
                    placeholder="Voor een accurate prijsindicatie"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bericht">Eventuele vragen of opmerkingen</Label>
                  <Textarea
                    id="bericht"
                    value={formData.bericht}
                    onChange={(e) => setFormData({ ...formData, bericht: e.target.value })}
                    placeholder="Vertel ons meer over je situatie..."
                    rows={4}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 h-14 text-lg">
                  <Shield className="h-5 w-5" />
                  Vraag gratis offerte aan
                  <ArrowRight className="h-5 w-5" />
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
        <footer className="py-16 px-6 border-t bg-muted/20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src={logoImage} alt="Khaylani Logo" className="h-10 w-auto" />
                  <div>
                    <div className="text-2xl font-bold">Khaylani</div>
                    <div className="text-sm text-muted-foreground">Recruitment data inzicht</div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Het moderne recruitment dashboard voor detacheringsbureaus. 
                  Centraliseer je data, monitor realtime en plaats sneller.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-11 w-11 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:scale-110"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a 
                    href="mailto:info@khaylani.nl"
                    className="h-11 w-11 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:scale-110"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-lg">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#offerte" className="text-muted-foreground hover:text-primary transition-colors">Prijzen</a></li>
                  <li><Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">Demo</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-lg">Support</h3>
                <ul className="space-y-3">
                  <li><a href="#offerte" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                  <li><Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">Inloggen</Link></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Khaylani. Alle rechten voorbehouden.</p>
              <p className="mt-2">Gemaakt met ❤️ voor recruitment professionals</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
