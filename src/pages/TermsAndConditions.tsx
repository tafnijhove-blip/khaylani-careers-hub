import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";

const TermsAndConditions = () => {
  return (
    <>
      <Helmet>
        <title>Algemene Voorwaarden - Khaylani Careers Hub</title>
        <meta
          name="description"
          content="Algemene voorwaarden voor het gebruik van Khaylani Careers Hub recruitment dashboard."
        />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <Link to="/">
            <Button variant="ghost" className="mb-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Terug naar home
            </Button>
          </Link>

          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h1>Algemene Voorwaarden</h1>
            <p className="text-muted-foreground">
              Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}
            </p>

            <section className="mt-8">
              <h2>1. Definities</h2>
              <p>
                In deze algemene voorwaarden wordt verstaan onder:
              </p>
              <ul>
                <li>
                  <strong>Khaylani:</strong> De aanbieder van de recruitment dashboard software en diensten.
                </li>
                <li>
                  <strong>Klant:</strong> De natuurlijke of rechtspersoon die gebruik maakt van de diensten van Khaylani.
                </li>
                <li>
                  <strong>Platform:</strong> De software en systemen van Khaylani waarmee recruitmentprocessen worden beheerd.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2>2. Toepasselijkheid</h2>
              <p>
                Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes en overeenkomsten tussen Khaylani en haar klanten. Afwijkingen zijn alleen geldig indien deze uitdrukkelijk schriftelijk zijn overeengekomen.
              </p>
            </section>

            <section className="mt-8">
              <h2>3. Dienstverlening</h2>
              <p>
                Khaylani biedt een cloud-based recruitment dashboard platform aan waarmee detacheringsbureaus hun vacatures, kandidaten en recruitment activiteiten kunnen beheren. De dienstverlening omvat:
              </p>
              <ul>
                <li>Toegang tot het online platform</li>
                <li>Realtime data synchronisatie</li>
                <li>Geografische visualisatie van vacatures</li>
                <li>Analytics en rapportage functionaliteiten</li>
                <li>Technische ondersteuning</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2>4. Tarieven en Betaling</h2>
              <p>
                De tarieven worden vastgesteld op basis van het aantal gebruikers en de gewenste functionaliteiten. Betalingen dienen binnen de overeengekomen termijn te worden voldaan. Bij niet-tijdige betaling behoudt Khaylani zich het recht voor de toegang tot het platform op te schorten.
              </p>
            </section>

            <section className="mt-8">
              <h2>5. Gebruiksrechten</h2>
              <p>
                De klant verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht op het platform voor de duur van de overeenkomst. Het is niet toegestaan het platform te kopiëren, te reverse-engineeren of op andere wijze te reproduceren.
              </p>
            </section>

            <section className="mt-8">
              <h2>6. Privacy en Gegevensbescherming</h2>
              <p>
                Khaylani verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG). Voor meer informatie verwijzen wij naar ons <Link to="/privacy" className="text-primary hover:underline">privacybeleid</Link>.
              </p>
            </section>

            <section className="mt-8">
              <h2>7. Beschikbaarheid en Onderhoud</h2>
              <p>
                Khaylani streeft naar een uptime van 99,5%. Gepland onderhoud wordt tijdig gecommuniceerd. Voor ongepland onderhoud of storingen wordt zo snel mogelijk actie ondernomen.
              </p>
            </section>

            <section className="mt-8">
              <h2>8. Aansprakelijkheid</h2>
              <p>
                Khaylani is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of verlies van data. De aansprakelijkheid is beperkt tot het bedrag dat in het betreffende jaar door de klant is betaald.
              </p>
            </section>

            <section className="mt-8">
              <h2>9. Looptijd en Opzegging</h2>
              <p>
                De overeenkomst wordt aangegaan voor bepaalde tijd, tenzij anders overeengekomen. Opzegging dient schriftelijk te gebeuren met inachtneming van een opzegtermijn van één maand.
              </p>
            </section>

            <section className="mt-8">
              <h2>10. Wijzigingen</h2>
              <p>
                Khaylani behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen worden tijdig gecommuniceerd en treden in werking na 30 dagen na aankondiging.
              </p>
            </section>

            <section className="mt-8">
              <h2>11. Toepasselijk Recht</h2>
              <p>
                Op deze voorwaarden en alle overeenkomsten is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
              </p>
            </section>

            <section className="mt-8 pt-8 border-t">
              <h2>Contact</h2>
              <p>
                Voor vragen over deze algemene voorwaarden kunt u contact opnemen via:
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:info@khaylani.nl" className="text-primary hover:underline">
                  info@khaylani.nl
                </a>
              </p>
            </section>
          </article>
        </div>
      </div>
    </>
  );
};

export default TermsAndConditions;
