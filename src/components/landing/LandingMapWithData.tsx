import { useState } from "react";
import MapView from "@/components/MapView";
import { VacatureDetailDialog } from "@/components/VacatureDetailDialog";

// Types aligned with MapView and Dialog
interface Bedrijf {
  id: string;
  naam: string;
  regio: string;
  plaats: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
}

interface Vacature {
  id: string;
  functietitel: string;
  status: string;
  prioriteit: string;
  aantal_posities: number;
  bedrijf_id: string;
  vereisten: string[] | null;
  beloning: string | null;
  opmerkingen: string | null;
  datum_toegevoegd: string;
}

interface VacatureStat {
  id: string;
  posities_vervuld: number;
  posities_open: number;
}

const LandingMapWithData = () => {
  // Fictieve bedrijven (met coördinaten NL)
  const bedrijven: Bedrijf[] = [
    { id: "b-am-1", naam: "TechCorp Amsterdam", regio: "Noord-Holland", plaats: "Amsterdam", lat: 52.3676, lng: 4.9041, logo_url: null },
    { id: "b-rt-1", naam: "InnovatieHub Rotterdam", regio: "Zuid-Holland", plaats: "Rotterdam", lat: 51.9225, lng: 4.4792, logo_url: null },
    { id: "b-ut-1", naam: "Digital Solutions Utrecht", regio: "Utrecht", plaats: "Utrecht", lat: 52.0907, lng: 5.1214, logo_url: null },
    { id: "b-dh-1", naam: "StartUp Den Haag", regio: "Zuid-Holland", plaats: "Den Haag", lat: 52.0705, lng: 4.3007, logo_url: null },
    { id: "b-eh-1", naam: "FinTech Eindhoven", regio: "Noord-Brabant", plaats: "Eindhoven", lat: 51.4416, lng: 5.4697, logo_url: null },
    { id: "b-gr-1", naam: "AI Labs Groningen", regio: "Groningen", plaats: "Groningen", lat: 53.2194, lng: 6.5665, logo_url: null },
  ];

  const vacatures: Vacature[] = [
    { id: "v-1", functietitel: "Senior Java Developer", status: "open", prioriteit: "urgent", aantal_posities: 3, bedrijf_id: "b-am-1", vereisten: ["Java", "Spring Boot", "Microservices"], beloning: "€5.500 - €7.000", opmerkingen: "Hybride, 2-3 dagen kantoor.", datum_toegevoegd: new Date().toISOString() },
    { id: "v-2", functietitel: "Frontend Engineer (React)", status: "open", prioriteit: "hoog", aantal_posities: 2, bedrijf_id: "b-rt-1", vereisten: ["React", "TypeScript", "Tailwind"], beloning: "€4.800 - €6.200", opmerkingen: null, datum_toegevoegd: new Date().toISOString() },
    { id: "v-3", functietitel: "Product Manager", status: "invulling", prioriteit: "hoog", aantal_posities: 2, bedrijf_id: "b-rt-1", vereisten: ["Agile", "Scrum", "Roadmapping"], beloning: "€6.000 - €8.000", opmerkingen: "Enterprise omgeving.", datum_toegevoegd: new Date().toISOString() },
    { id: "v-4", functietitel: "UX/UI Designer", status: "open", prioriteit: "normaal", aantal_posities: 1, bedrijf_id: "b-ut-1", vereisten: ["Figma", "Design Systems"], beloning: "€4.500 - €6.000", opmerkingen: null, datum_toegevoegd: new Date().toISOString() },
    { id: "v-5", functietitel: "Data Engineer", status: "open", prioriteit: "hoog", aantal_posities: 2, bedrijf_id: "b-dh-1", vereisten: ["Python", "Airflow", "DBT"], beloning: "€5.800 - €7.200", opmerkingen: null, datum_toegevoegd: new Date().toISOString() },
    { id: "v-6", functietitel: "DevOps Engineer", status: "open", prioriteit: "normaal", aantal_posities: 1, bedrijf_id: "b-eh-1", vereisten: ["AWS", "Kubernetes", "CI/CD"], beloning: "€5.500 - €6.800", opmerkingen: null, datum_toegevoegd: new Date().toISOString() },
    { id: "v-7", functietitel: "AI Researcher", status: "open", prioriteit: "urgent", aantal_posities: 1, bedrijf_id: "b-gr-1", vereisten: ["LLMs", "Python", "PyTorch"], beloning: "€6.500 - €8.500", opmerkingen: "Publicaties een plus.", datum_toegevoegd: new Date().toISOString() },
  ];

  const vacatureStats: VacatureStat[] = [
    { id: "v-1", posities_open: 3, posities_vervuld: 0 },
    { id: "v-2", posities_open: 2, posities_vervuld: 0 },
    { id: "v-3", posities_open: 1, posities_vervuld: 1 },
    { id: "v-4", posities_open: 1, posities_vervuld: 0 },
    { id: "v-5", posities_open: 2, posities_vervuld: 0 },
    { id: "v-6", posities_open: 1, posities_vervuld: 0 },
    { id: "v-7", posities_open: 1, posities_vervuld: 0 },
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVacature, setSelectedVacature] = useState<Vacature | null>(null);

  const selectedBedrijf = selectedVacature
    ? bedrijven.find((b) => b.id === selectedVacature.bedrijf_id) || null
    : null;

  const selectedStats = selectedVacature
    ? vacatureStats.find((s) => s.id === selectedVacature.id) || null
    : null;

  return (
    <div className="relative">
      <MapView
        bedrijven={bedrijven}
        vacatures={vacatures}
        vacatureStats={vacatureStats}
        onVacatureClick={(v) => {
          setSelectedVacature(v);
          setDialogOpen(true);
        }}
      />

      <VacatureDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vacature={selectedVacature}
        bedrijf={selectedBedrijf}
        stats={selectedStats}
      />
    </div>
  );
};

export default LandingMapWithData;
