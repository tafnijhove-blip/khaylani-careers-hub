import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MapPin, Filter, Building2, Briefcase, TrendingUp } from "lucide-react";

// Mockdata voor demo
const MOCK_COMPANIES = [
  { id: "1", name: "TechCorp Amsterdam", lat: 52.3676, lng: 4.9041, region: "Noord-Holland", vacancies: 5 },
  { id: "2", name: "InnovateBV Rotterdam", lat: 51.9225, lng: 4.47917, region: "Zuid-Holland", vacancies: 8 },
  { id: "3", name: "BuildIt Utrecht", lat: 52.0907, lng: 5.1214, region: "Utrecht", vacancies: 3 },
  { id: "4", name: "HealthPlus Den Haag", lat: 52.0705, lng: 4.3007, region: "Zuid-Holland", vacancies: 6 },
  { id: "5", name: "LogisticsPro Eindhoven", lat: 51.4416, lng: 5.4697, region: "Noord-Brabant", vacancies: 4 },
  { id: "6", name: "FoodService Groningen", lat: 53.2194, lng: 6.5665, region: "Groningen", vacancies: 7 },
  { id: "7", name: "RetailHub Arnhem", lat: 51.9851, lng: 5.8987, region: "Gelderland", vacancies: 2 },
  { id: "8", name: "ConstructX Maastricht", lat: 50.8514, lng: 5.6909, region: "Limburg", vacancies: 9 },
];

const MapboxDemoMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [minVacancies, setMinVacancies] = useState(0);

  const regions = Array.from(new Set(MOCK_COMPANIES.map(c => c.region))).sort();
  
  const filteredCompanies = MOCK_COMPANIES.filter(company => {
    const regionMatch = selectedRegion === "all" || company.region === selectedRegion;
    const vacancyMatch = company.vacancies >= minVacancies;
    return regionMatch && vacancyMatch;
  });

  const regionalStats = regions.map(region => ({
    region,
    count: MOCK_COMPANIES.filter(c => c.region === region).reduce((sum, c) => sum + c.vacancies, 0)
  })).sort((a, b) => b.count - a.count);

  const totalVacancies = filteredCompanies.reduce((sum, c) => sum + c.vacancies, 0);

  useEffect(() => {
    if (!mapContainer.current) return;

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [5.2913, 52.1326],
      zoom: 7,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach(marker => marker.remove());

    filteredCompanies.forEach(company => {
      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#00AEEF";
      el.style.border = "3px solid white";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "bold";
      el.style.fontSize = "14px";
      el.textContent = company.vacancies.toString();

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1a1a1a;">${company.name}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Regio:</strong> ${company.region}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Open vacatures:</strong> ${company.vacancies}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Recruiter:</strong> Demo User</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([company.lng, company.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    if (filteredCompanies.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredCompanies.forEach(company => {
        bounds.extend([company.lng, company.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [mapLoaded, filteredCompanies]);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Interactieve Vacaturekaart</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ontdek vacatures op de kaart en vind jouw perfecte match in de regio
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Filters</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region-filter" className="text-sm font-medium">
                    Regio
                  </Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger id="region-filter">
                      <SelectValue placeholder="Selecteer regio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle regio's</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-vacancies" className="text-sm font-medium">
                    Min. vacatures: {minVacancies}
                  </Label>
                  <Slider
                    id="min-vacancies"
                    min={0}
                    max={10}
                    step={1}
                    value={[minVacancies]}
                    onValueChange={(values) => setMinVacancies(values[0])}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUseLocation}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Gebruik mijn locatie
                </Button>
              </div>
            </Card>

            {/* Stats Cards */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span className="font-medium">Totaal Vacatures</span>
                  </div>
                  <Badge variant="secondary">{totalVacancies}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Bedrijven</span>
                  </div>
                  <Badge variant="secondary">{filteredCompanies.length}</Badge>
                </div>
              </div>
            </Card>

            {/* Top Regions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Top 5 Regio's</h3>
              </div>
              <div className="space-y-2">
                {regionalStats.slice(0, 5).map((stat, index) => (
                  <button
                    key={stat.region}
                    onClick={() => setSelectedRegion(stat.region)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-sm font-medium">
                      {index + 1}. {stat.region}
                    </span>
                    <Badge variant="outline">{stat.count}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-2xl relative">
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <LoadingSpinner />
                </div>
              )}
              <div ref={mapContainer} className="w-full h-[600px]" />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapboxDemoMap;
