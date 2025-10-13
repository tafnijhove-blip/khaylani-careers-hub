import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [minVacancies, setMinVacancies] = useState<number>(0);

  // Fetch data from Supabase
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
          const companiesWithVacancies: CompanyWithVacancies[] = companiesRes.data.map(company => {
            const companyVacancies = vacanciesRes.data.filter(v => v.bedrijf_id === company.id);
            return {
              ...company,
              vacancies: companyVacancies,
              vacancyCount: companyVacancies.length
            };
          }).filter(c => c.vacancyCount > 0);

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

  // Filter companies based on selected filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
      const vacancyMatch = company.vacancyCount >= minVacancies;
      return regionMatch && vacancyMatch;
    });
  }, [companies, selectedRegion, minVacancies]);

  // Get unique regions for filter
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(companies.map(c => c.regio)));
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

  // Get pin color based on vacancy count
  const getPinColor = (count: number) => {
    if (count <= 2) return "#60A5FA"; // light blue
    if (count <= 5) return "#3B82F6"; // medium blue
    return "#1D4ED8"; // dark blue
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const isSupported = (maplibregl as any)?.supported ? (maplibregl as any).supported() : true;
    if (!isSupported) {
      console.error("Map rendering is not supported in this browser/device (WebGL disabled).");
      return;
    }

    console.log("Initializing map...");
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
            maxzoom: 19
          }
        },
        layers: [
          { id: "osm", type: "raster", source: "osm" }
        ]
      },
      center: [5.2913, 52.1326],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18
    });

    map.current = mapInstance;

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

    const onLoad = () => {
      console.log("Map loaded");
      // Force a resize in case the container size changed while loading (e.g. cookie banner)
      mapInstance.resize();
    };

    const onError = (e: any) => {
      console.error("Map error:", e?.error || e);
    };

    mapInstance.on("load", onLoad);
    mapInstance.on("error", onError);

    // Also attempt a resize after a short delay as a safety net
    const resizeTimeout = window.setTimeout(() => mapInstance.resize(), 500);

    return () => {
      window.clearTimeout(resizeTimeout);
      mapInstance.off("load", onLoad);
      mapInstance.off("error", onError);
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Add markers when companies data changes
  useEffect(() => {
    if (!map.current || filteredCompanies.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredCompanies.forEach(company => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.cssText = `
        background-color: ${getPinColor(company.vacancyCount)};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const label = document.createElement("div");
      label.style.cssText = `
        transform: rotate(45deg);
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      `;
      label.textContent = company.vacancyCount.toString();
      el.appendChild(label);

      el.addEventListener("mouseenter", () => {
        el.style.transform = "rotate(-45deg) scale(1.1)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "rotate(-45deg) scale(1)";
      });

      const popupHTML = `
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1e293b;">
            ${company.naam}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
            ${company.plaats || company.regio}
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #0ea5e9; font-weight: 600;">
            ${company.vacancyCount} open ${company.vacancyCount === 1 ? 'vacature' : 'vacatures'}
          </p>
          <div style="margin-bottom: 12px;">
            ${company.vacancies.slice(0, 3).map(v => `
              <div style="padding: 4px 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 4px; font-size: 13px;">
                ${v.functietitel}
              </div>
            `).join('')}
          </div>
          <button 
            onclick="window.location.href='#vacatures'"
            style="
              width: 100%;
              padding: 8px;
              background: #0077FF;
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            "
          >
            Bekijk alle vacatures
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([company.lng, company.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredCompanies.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filteredCompanies.forEach(company => {
        bounds.extend([company.lng, company.lat]);
      });
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 });
    }
  }, [filteredCompanies]);

  // User location button handler
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 10,
            duration: 2000
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" message="Laden van vacaturekaart..." />
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background via-background to-primary/5">
      {/* CTA Banner */}
      <div className="container mx-auto px-4 mb-8">
        <Card className="bg-gradient-primary text-white p-8 text-center border-0">
          <h2 className="text-3xl font-bold mb-4">
            Ontdek waar je klanten de meeste vacatures hebben
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Interactieve kaart met real-time vacaturedata per regio
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setSelectedRegion("all")}
            className="bg-white text-primary hover:bg-white/90"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Verken mijn regio
          </Button>
        </Card>
      </div>

      {/* Map Container */}
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Map */}
            <div className="flex-1 relative">
              <Card className="overflow-hidden border-2 shadow-xl">
                <div ref={mapContainer} className="w-full h-[600px]" />
              </Card>

              {/* Filters Overlay */}
              <JobMapFilters
                regions={regions}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                minVacancies={minVacancies}
                onMinVacanciesChange={setMinVacancies}
                onUseLocation={centerOnUserLocation}
              />

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border">
                <h4 className="font-semibold text-sm mb-3 text-foreground">Vacatures per bedrijf</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#60A5FA" }} />
                    <span>1-2 vacatures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                    <span>3-5 vacatures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#1D4ED8" }} />
                    <span>6+ vacatures</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <JobMapStats 
              regionalStats={regionalStats}
              totalVacancies={filteredCompanies.reduce((sum, c) => sum + c.vacancyCount, 0)}
              totalCompanies={filteredCompanies.length}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveJobMap;
