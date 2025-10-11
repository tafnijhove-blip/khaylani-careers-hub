import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Mail
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-khaylani.png";

const Index = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    naam: "",
    bedrijfsnaam: "",
    email: "",
    aantalMedewerkers: "",
    bericht: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Offerte aangevraagd!",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Khaylani Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gradient">Khaylani</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Inloggen
              </Button>
            </Link>
            <a href="#offerte">
              <Button size="sm" className="gap-2">
                Offerte aanvragen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="cyber-grid absolute inset-0 opacity-30" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Maak je recruitmentdata{" "}
              <span className="text-gradient">inzichtelijk</span> met Khaylani
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Ontdek waar je vacatures openstaan, welke bedrijven actief zijn en geef je recruiters 
              directe toegang tot realtime inzichten.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href="#offerte">
                <Button size="lg" className="gap-2 hover-lift">
                  Offerte aanvragen
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="hover-lift">
                  Bekijk demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Card className="glass-card p-4 hover-glow">
              <div className="aspect-video rounded-lg bg-gradient-card border flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-20 w-20 mx-auto text-primary animate-pulse" />
                  <p className="text-muted-foreground">Dashboard Preview</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Hoe het werkt
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card p-8 hover-lift group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-all">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Centraliseer je data</h3>
              <p className="text-muted-foreground">
                Krijg één overzicht van al je openstaande vacatures en aangesloten bedrijven.
              </p>
            </Card>

            <Card className="glass-card p-8 hover-lift group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-all">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Realtime inzicht</h3>
              <p className="text-muted-foreground">
                Zie direct waar je team op focust en welke bedrijven het meest actief zijn.
              </p>
            </Card>

            <Card className="glass-card p-8 hover-lift group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-all">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Efficiënt schakelen</h3>
              <p className="text-muted-foreground">
                Geef je recruiters direct toegang tot de juiste informatie om sneller te plaatsen.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Keylani */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
              Waarom Khaylani voor jou werkt
            </h2>
            <p className="text-xl text-muted-foreground">
              Als detacheerder wil je overzicht, snelheid en inzicht. 
              Khaylani brengt alle data van je recruiters samen in één overzichtelijk platform.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: MapPin, text: "Alle vacatures op één plek" },
                  { icon: Clock, text: "Live overzicht van recruiter-activiteit" },
                  { icon: Users, text: "Eenvoudig nieuwe medewerkers toevoegen" },
                  { icon: BarChart3, text: "Geautomatiseerde rapportages" }
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="glass-card p-8 hover-glow">
              <div className="space-y-6">
                <div className="aspect-square rounded-lg bg-gradient-card border flex items-center justify-center">
                  <CheckCircle2 className="h-32 w-32 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "Sinds we Khaylani gebruiken, besparen we 30% tijd op rapportages en hebben we eindelijk realtime inzicht in onze recruitment activiteiten."
                  </p>
                  <p className="mt-4 font-semibold">— CEO, Detacheringsbureau</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA / Offerte Form */}
      <section id="offerte" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Vraag een offerte aan
            </h2>
            <p className="text-xl text-muted-foreground">
              Binnen 24 uur nemen we contact met je op met een persoonlijk voorstel
            </p>
          </div>

          <Card className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="naam">Naam *</Label>
                <Input
                  id="naam"
                  required
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  placeholder="Je volledige naam"
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
                />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aantalMedewerkers">Aantal medewerkers</Label>
                <Input
                  id="aantalMedewerkers"
                  value={formData.aantalMedewerkers}
                  onChange={(e) => setFormData({ ...formData, aantalMedewerkers: e.target.value })}
                  placeholder="Voor prijsindicatie"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bericht">Eventuele vragen of opmerkingen</Label>
                <Textarea
                  id="bericht"
                  value={formData.bericht}
                  onChange={(e) => setFormData({ ...formData, bericht: e.target.value })}
                  placeholder="Optioneel"
                  rows={4}
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                Vraag offerte aan
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Khaylani Logo" className="h-8 w-auto" />
              <div>
                <div className="text-xl font-bold">Khaylani</div>
                <div className="text-sm text-muted-foreground">Inzicht in je recruitmentdata</div>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/auth" className="hover:text-primary transition-colors">Inloggen</Link>
              <a href="#offerte" className="hover:text-primary transition-colors">Contact</a>
            </div>

            <div className="flex gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                 className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:info@keylani.nl"
                 className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Khaylani. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
