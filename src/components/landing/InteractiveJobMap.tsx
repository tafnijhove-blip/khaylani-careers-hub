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

  // Initialize map with better tile loading
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("🗺️ Initializing map...");
    
    try {
      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxzoom: 19
            }
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [5.2913, 52.1326], // Netherlands center
        zoom: 7,
        minZoom: 6,
        maxZoom: 18
      });

      map.current = mapInstance;

      // Add navigation controls
      mapInstance.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false
        }),
        "top-right"
      );

      mapInstance.on("load", () => {
        console.log("✅ Map loaded successfully");
        mapInstance.resize();
      });

      mapInstance.on("error", (e) => {
        console.error("❌ Map error:", e);
      });

      // Safety resize after mount
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.resize();
          console.log("🔄 Map resized");
        }
      }, 100);

      return () => {
        console.log("🧹 Cleaning up map");
        mapInstance.remove();
        map.current = null;
      };
    } catch (error) {
      console.error("❌ Failed to initialize map:", error);
    }
  }, []);

  // Add markers with company names visible on map
  useEffect(() => {
    if (!map.current || filteredCompanies.length === 0) return;

    console.log(`📍 Adding ${filteredCompanies.length} markers to map`);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers with visible company names
    filteredCompanies.forEach(company => {
      // Create pin container
      const pinContainer = document.createElement("div");
      pinContainer.className = "map-pin-container";
      pinContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        position: relative;
      `;

      // Company name label (always visible)
      const nameLabel = document.createElement("div");
      nameLabel.style.cssText = `
        background: white;
        color: #000;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        margin-bottom: 4px;
        pointer-events: none;
      `;
      nameLabel.textContent = company.naam;

      // Pin marker
      const pin = document.createElement("div");
      pin.style.cssText = `
        background-color: #0077FF;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,119,255,0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Vacancy count inside pin
      const countLabel = document.createElement("div");
      countLabel.style.cssText = `
        transform: rotate(45deg);
        font-size: 11px;
        font-weight: bold;
        color: white;
      `;
      countLabel.textContent = company.vacancyCount.toString();
      pin.appendChild(countLabel);

      pinContainer.appendChild(nameLabel);
      pinContainer.appendChild(pin);

      // Hover effects
      pinContainer.addEventListener("mouseenter", () => {
        pin.style.transform = "rotate(-45deg) scale(1.15)";
        pin.style.boxShadow = "0 4px 15px rgba(0,119,255,0.6)";
        nameLabel.style.background = "#0077FF";
        nameLabel.style.color = "white";
      });

      pinContainer.addEventListener("mouseleave", () => {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = "0 3px 10px rgba(0,119,255,0.4)";
        nameLabel.style.background = "white";
        nameLabel.style.color = "#000";
      });

      // Popup content
      const popupHTML = `
        <div style="padding: 16px; min-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b;">
            ${company.naam}
          </h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
            📍 ${company.plaats || company.regio}
          </p>
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #0077FF; font-weight: 600;">
            ${company.vacancyCount} open ${company.vacancyCount === 1 ? 'vacature' : 'vacatures'}
          </p>
          <div style="margin-bottom: 16px;">
            ${company.vacancies.slice(0, 3).map(v => `
              <div style="padding: 6px 10px; background: #f1f5f9; border-radius: 6px; margin-bottom: 6px; font-size: 13px; color: #1e293b;">
                ${v.functietitel}
              </div>
            `).join('')}
            ${company.vacancyCount > 3 ? `<p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">+${company.vacancyCount - 3} meer...</p>` : ''}
          </div>
          <button 
            onclick="window.location.href='#vacatures'"
            style="
              width: 100%;
              padding: 10px;
              background: #0077FF;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#0066DD'"
            onmouseout="this.style.background='#0077FF'"
          >
            Bekijk alle vacatures →
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        className: "map-popup"
      }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({
        element: pinContainer,
        anchor: "bottom"
      })
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
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 11, duration: 1000 });
    }

    console.log("✅ Markers added successfully");
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
        <Card className="bg-gradient-primary text-white p-8 text-center border-0 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ontdek waar je klanten de meeste vacatures hebben
          </h2>
          <p className="text-lg mb-6 text-white/90 max-w-2xl mx-auto">
            Interactieve kaart met real-time vacaturedata per regio
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => {
              setSelectedRegion("all");
              centerOnUserLocation();
            }}
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
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
              <Card className="overflow-hidden border-2 shadow-2xl rounded-xl">
                <div 
                  ref={mapContainer} 
                  className="w-full h-[600px] bg-gray-100"
                  style={{ minHeight: "600px" }}
                />
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
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border-2">
                <h4 className="font-semibold text-sm mb-3 text-foreground">Legenda</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0077FF]" />
                    <span>Bedrijven met vacatures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Klik op een pin voor details</span>
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
