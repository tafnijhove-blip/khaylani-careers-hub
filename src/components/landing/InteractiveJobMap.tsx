import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import JobMapFilters from "./JobMapFilters";
import JobMapStats from "./JobMapStats";

interface Company {
  id: string;
  naam: string;
  plaats: string | null;
  regio: string;
  lat: number;
  lng: number;
  logo_url: string | null;
}

interface Vacancy {
  id: string;
  functietitel: string;
  bedrijf_id: string;
  status: string;
}

interface CompanyWithVacancies extends Company {
  vacancies: Vacancy[];
  vacancyCount: number;
}

const InteractiveJobMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [minVacancies, setMinVacancies] = useState<number>(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, vacanciesRes] = await Promise.all([
          supabase
            .from("bedrijven")
            .select("*")
            .not("lat", "is", null)
            .not("lng", "is", null),
          supabase
            .from("vacatures")
            .select("*")
            .eq("status", "open")
        ]);

        if (companiesRes.data && vacanciesRes.data) {
          const companiesWithVacancies = companiesRes.data
            .map(company => {
              const companyVacancies = vacanciesRes.data!.filter(v => v.bedrijf_id === company.id);
              return { ...company, vacancies: companyVacancies, vacancyCount: companyVacancies.length };
            })
            .filter(c => c.vacancyCount > 0);
          setCompanies(companiesWithVacancies);
        }
      } catch (err) {
        console.error("Error fetching map data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      (selectedRegion === "all" || c.regio === selectedRegion) &&
      c.vacancyCount >= minVacancies
    );
  }, [companies, selectedRegion, minVacancies]);

  // Regions for filter
  const regions = useMemo(() => Array.from(new Set(companies.map(c => c.regio))).sort(), [companies]);

  // Map initialization
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      if (!mapContainer.current.offsetHeight) {
        requestAnimationFrame(initMap);
        return;
      }

      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
        center: [5.2913, 52.1326],
        zoom: 7,
        minZoom: 5,
        maxZoom: 18,
      });

      map.current = mapInstance;

      // Controls
      mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      // Mobile friendly
      if (window.innerWidth < 768) {
        mapInstance.scrollZoom.disable();
        mapInstance.doubleClickZoom.disable();
        mapInstance.touchZoomRotate.disableRotation();
      }

      mapInstance.on("load", () => {
        setMapLoaded(true);
        mapInstance.resize();
      });

      mapInstance.on("error", () => {
        console.warn("Map error, switching fallback style");
        mapInstance.setStyle({
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256
            }
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }]
        });
      });
    };

    initMap();
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredCompanies.forEach(company => {
      if (!company.lat || !company.lng) return;

      const pin = document.createElement("div");
      pin.style.cssText = "background: #0077FF; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; display:flex; align-items:center; justify-content:center;";
      const countLabel = document.createElement("div");
      countLabel.style.cssText = "transform: rotate(45deg); color:white; font-size:11px; font-weight:bold;";
      countLabel.textContent = company.vacancyCount.toString();
      pin.appendChild(countLabel);

      const marker = new maplibregl.Marker(pin)
        .setLngLat([company.lng, company.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(<strong>${company.naam}</strong><br/>${company.vacancyCount} vacatures))
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (filteredCompanies.length) {
      const bounds = new maplibregl.LngLatBounds();
      filteredCompanies.forEach(c => bounds.extend([c.lng, c.lat]));
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 11, duration: 1000 });
    }
  }, [filteredCompanies, mapLoaded]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <LoadingSpinner size="lg" message="Laden van kaart..." />
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 mb-8">
        <Card className="p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Ontdek vacatures per regio</h2>
          <Button onClick={() => map.current?.flyTo({ center: [5.2913, 52.1326], zoom: 10 })}>
            <MapPin className="mr-2 h-5 w-5" />
            Verken mijn regio
          </Button>
        </Card>
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative">
          <Card className="overflow-hidden rounded-xl shadow-2xl">
            <div ref={mapContainer} className="w-full h-[600px]" />
          </Card>
          <JobMapFilters
            regions={regions}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            minVacancies={minVacancies}
            onMinVacanciesChange={setMinVacancies}
            onUseLocation={() => {
              navigator.geolocation.getCurrentPosition(pos => {
                map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 10 });
              });
            }}
          />
        </div>

        <JobMapStats
          regionalStats={regions.map(r => ({ region: r, count: filteredCompanies.filter(c => c.regio === r).length }))}
          totalVacancies={filteredCompanies.reduce((a, c) => a + c.vacancyCount, 0)}
          totalCompanies={filteredCompanies.length}
        />
      </div>
    </section>
  );
};

export default InteractiveJobMap;
