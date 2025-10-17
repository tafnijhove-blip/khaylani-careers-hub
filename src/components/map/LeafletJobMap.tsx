import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import MarkerClusterGroup from "react-leaflet-cluster";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import JobMapFilters from "@/components/landing/JobMapFilters";
import JobMapStats from "@/components/landing/JobMapStats";

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

const LeafletJobMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [minVacancies, setMinVacancies] = useState<number>(0);

  const NL_BOUNDS: L.LatLngBoundsExpression = [
    [50.7, 3.2],
    [53.7, 7.3],
  ];

  const isWithinNetherlands = (lat: number, lng: number) =>
    lng >= 3.2 && lng <= 7.3 && lat >= 50.7 && lat <= 53.7;

  const getCompanyLngLat = (company: Company): [number, number] | null => {
    const rawLng = Number(company.lng);
    const rawLat = Number(company.lat);

    if (isWithinNetherlands(rawLat, rawLng)) return [rawLat, rawLng];
    if (isWithinNetherlands(rawLng, rawLat)) return [rawLng, rawLat];
    return null;
  };

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
          supabase.from("vacatures").select("*").eq("status", "open"),
        ]);

        if (companiesRes.data && vacanciesRes.data) {
          const companiesWithVacancies: CompanyWithVacancies[] = companiesRes.data
            .map((company) => {
              const companyVacancies = vacanciesRes.data!.filter(
                (v) => v.bedrijf_id === company.id
              );
              return {
                ...company,
                vacancies: companyVacancies,
                vacancyCount: companyVacancies.length,
              } as CompanyWithVacancies;
            })
            .filter(
              (c) =>
                c.vacancyCount > 0 &&
                isWithinNetherlands(Number(c.lat), Number(c.lng))
            );

          setCompanies(companiesWithVacancies);
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
      const vacancyMatch = company.vacancyCount >= minVacancies;
      return regionMatch && vacancyMatch;
    });
  }, [companies, selectedRegion, minVacancies]);

  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(companies.map((c) => c.regio)));
    return uniqueRegions.sort();
  }, [companies]);

  // Calculate regional stats
  const regionalStats = useMemo(() => {
    const stats = companies.reduce((acc, company) => {
      if (!acc[company.regio]) {
        acc[company.regio] = 0;
      }
      acc[company.regio] += company.vacancyCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [companies]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [52.1326, 5.2913],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: NL_BOUNDS,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add province boundaries
    fetch("https://cartomap.github.io/nl/wgs84/provincie_2023.geojson")
      .then((res) => res.json())
      .then((data) => {
        L.geoJSON(data, {
          style: {
            color: "hsl(189, 70%, 48%)",
            weight: 2,
            opacity: 0.6,
            fillColor: "hsl(189, 70%, 48%)",
            fillOpacity: 0.05,
          },
        }).addTo(map);
      })
      .catch((err) => console.warn("Could not load provinces:", err));

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and heatmap
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Remove old heatmap
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    const heatPoints: [number, number, number][] = [];
    const bounds: L.LatLngBoundsExpression = [];

    filteredCompanies.forEach((company) => {
      const coords = getCompanyLngLat(company);
      if (!coords) return;

      bounds.push(coords);

      // Add to heatmap data
      heatPoints.push([coords[0], coords[1], company.vacancyCount]);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              margin-bottom: 4px;
              white-space: nowrap;
            ">${company.naam}</div>
            <div style="
              background: linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%));
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 3px 10px rgba(8, 211, 255, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                font-size: 11px;
                font-weight: 700;
                color: white;
              ">${company.vacancyCount}</div>
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
      });

      const marker = L.marker(coords, { icon: customIcon });

      // Popup
      const popupContent = `
        <div style="padding: 8px;">
          <h3 style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">${company.naam}</h3>
          <p style="color: #666; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${company.regio}
          </p>
          <p style="font-weight: 600; color: hsl(189, 70%, 48%);">${company.vacancyCount} openstaande vacature${company.vacancyCount !== 1 ? "s" : ""}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current!.addLayer(marker);
    });

    // Add heatmap
    if (heatPoints.length > 0) {
      heatLayerRef.current = (L as any).heatLayer(heatPoints, {
        radius: 30,
        blur: 20,
        maxZoom: 10,
        max: Math.max(...heatPoints.map((p) => p[2])),
        gradient: {
          0.0: "rgba(8, 211, 255, 0)",
          0.2: "rgba(8, 211, 255, 0.3)",
          0.4: "rgba(248, 113, 30, 0.5)",
          0.6: "rgba(248, 113, 30, 0.7)",
          0.8: "rgba(248, 113, 30, 0.9)",
          1.0: "rgba(248, 113, 30, 1)",
        },
      }).addTo(mapRef.current);
    }

    // Fit bounds
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [filteredCompanies]);

  const centerOnUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Locatiefunctie wordt niet ondersteund door deze browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mapRef.current) return;
        mapRef.current.flyTo(
          [position.coords.latitude, position.coords.longitude],
          13,
          { duration: 2 }
        );
      },
      () => {
        alert("Locatie kon niet worden opgehaald.");
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner message="Kaart laden..." />
      </div>
    );
  }

  return (
    <section className="py-16 space-y-8">
      <div className="container mx-auto px-4">
        {/* CTA Banner */}
        <div className="glass-card p-6 rounded-xl border border-primary/20 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Ontdek vacatures in jouw regio</h3>
                <p className="text-muted-foreground">
                  Realtime inzicht in openstaande vacatures per locatie
                </p>
              </div>
            </div>
            <Button onClick={centerOnUserLocation} className="gap-2">
              <MapPin className="h-4 w-4" />
              Gebruik mijn locatie
            </Button>
          </div>
        </div>

        {/* Map and Filters */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Card className="overflow-hidden border-2 border-primary/20">
              <div
                ref={mapContainerRef}
                className="w-full h-[600px]"
                style={{ minHeight: "600px" }}
              />
            </Card>
          </div>

          <div className="lg:w-80 space-y-6">
            <JobMapFilters
              regions={regions}
              selectedRegion={selectedRegion}
              minVacancies={minVacancies}
              onRegionChange={setSelectedRegion}
              onMinVacanciesChange={setMinVacancies}
              onUseLocation={centerOnUserLocation}
            />
            <JobMapStats 
              regionalStats={regionalStats}
              totalVacancies={companies.reduce((sum, c) => sum + c.vacancyCount, 0)}
              totalCompanies={companies.length}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeafletJobMap;
