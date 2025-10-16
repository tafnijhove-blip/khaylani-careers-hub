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
          const buildAddress = (c: Company) =>
            [c.naam, c.plaats, c.regio, "Nederland"].filter(Boolean).join(", ");

          const fixCompanyCoords = async (c: Company): Promise<Company> => {
            const coords = getCompanyLngLat(c);
            if (coords) return { ...c, lng: coords[0], lat: coords[1] } as Company;
            try {
              const { data, error } = await supabase.functions.invoke('geocode-address', {
                body: { address: buildAddress(c) },
              });
              if (error) throw error;
              if (data?.lng !== undefined && data?.lat !== undefined && isWithinNetherlands(Number(data.lng), Number(data.lat))) {
                return { ...c, lng: Number(data.lng), lat: Number(data.lat) } as Company;
              }
            } catch (e) {
              console.error('Geocoding failed for', c.naam, e);
            }
            return c;
          };

          const fixedCompanies = await Promise.all(companiesRes.data.map(fixCompanyCoords));

          const companiesWithVacancies: CompanyWithVacancies[] = fixedCompanies
            .map(company => {
              const companyVacancies = vacanciesRes.data!.filter(v => v.bedrijf_id === company.id);
              return {
                ...company,
                vacancies: companyVacancies,
                vacancyCount: companyVacancies.length
              } as CompanyWithVacancies;
            })
            .filter(c => c.vacancyCount > 0 && isWithinNetherlands(Number(c.lng), Number(c.lat)));

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

  // Netherlands bounds to validate coordinates
  const NL_BOUNDS = {
    minLng: 3.2,
    maxLng: 7.3,
    minLat: 50.7,
    maxLat: 53.7,
  };

  const isWithinNetherlands = (lng: number, lat: number) =>
    lng >= NL_BOUNDS.minLng &&
    lng <= NL_BOUNDS.maxLng &&
    lat >= NL_BOUNDS.minLat &&
    lat <= NL_BOUNDS.maxLat;

  // Normalize potential swapped coordinates and filter out invalid ones
  const getCompanyLngLat = (company: Company): [number, number] | null => {
    const rawLng = Number(company.lng);
    const rawLat = Number(company.lat);

    // First try as stored (lng, lat)
    if (isWithinNetherlands(rawLng, rawLat)) return [rawLng, rawLat];

    // Try swapped
    if (isWithinNetherlands(rawLat, rawLng)) {
      console.warn(`Swapped coords for ${company.naam}`);
      return [rawLat, rawLng];
    }

    // Discard if outside bounds
    return null;
  };

  // Initialize map with better tile loading
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("🗺️ Initializing map...");
    
    // Delay initialization to ensure container is visible
    const initMap = () => {
      try {
        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [
              { id: 'osm', type: 'raster', source: 'osm' },
            ],
          },
          center: [5.2913, 52.1326], // Netherlands center
          zoom: 7,
          minZoom: 5,
          maxZoom: 18
        });

        map.current = mapInstance;

        // Add navigation controls (compass only, no zoom)
        mapInstance.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: false,
            visualizePitch: false
          }),
          "top-right"
        );

        // Disable zoom interactions on mobile
        if (window.innerWidth < 768) {
          mapInstance.scrollZoom.disable();
          mapInstance.doubleClickZoom.disable();
          mapInstance.touchZoomRotate.disable();
        }

        // Track load and ensure resize when visible
        const switchToFallbackStyle = () => {
          try {
            console.warn("⚠️ Switching to fallback raster style");
            mapInstance.setStyle('https://demotiles.maplibre.org/style.json');
          } catch (err) {
            console.error("Failed to switch style:", err);
          }
        };

        mapInstance.on("load", () => {
          console.log("✅ Map loaded successfully");
          setMapLoaded(true);
          mapInstance.resize();
        });

        // Extra diagnostics
        mapInstance.on("styledata", () => {
          console.log("🎨 Style data loaded");
        });
        mapInstance.on("idle", () => {
          console.log("🟢 Map idle - tiles loaded:", mapInstance.areTilesLoaded());
        });

        // Fallback on error
        let errorCount = 0;
        mapInstance.on("error", (e) => {
          errorCount++;
          console.error("❌ Map error:", e);
          if (errorCount === 1) {
            // First error, try fallback style
            switchToFallbackStyle();
          }
        });

        // Resize when container size changes
        let resizeObserver: ResizeObserver | null = null;
        if (mapContainer.current) {
          resizeObserver = new ResizeObserver(() => {
            mapInstance.resize();
          });
          resizeObserver.observe(mapContainer.current);
        }

        // Add window resize handler
        const handleResize = () => {
          mapInstance.resize();
        };
        window.addEventListener('resize', handleResize);

        // Safety resize and fallback if tiles not loaded in time
        setTimeout(() => {
          try {
            if (mapInstance) {
              mapInstance.resize();
              const tilesOk = mapInstance.areTilesLoaded();
              console.log("🔄 Map resized, tiles loaded:", tilesOk);
              if (!tilesOk) switchToFallbackStyle();
            }
          } catch (err) {
            console.error("Post-init check failed:", err);
          }
        }, 600);

        return () => {
          console.log("🧹 Cleaning up map");
          window.removeEventListener('resize', handleResize);
          resizeObserver?.disconnect();
          setMapLoaded(false);
          mapInstance.remove();
          map.current = null;
        };
      } catch (error) {
        console.error("❌ Failed to initialize map:", error);
      }
    };

    // Use requestAnimationFrame and setTimeout to delay initialization
    requestAnimationFrame(() => {
      setTimeout(initMap, 300);
    });
  }, []);

  // Add markers with company names visible on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log(`📍 Adding ${filteredCompanies.length} markers to map`);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (filteredCompanies.length === 0) return;

    // Add new markers with visible company names
    filteredCompanies.forEach(company => {
      const coords = getCompanyLngLat(company);
      if (!coords) return;
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
        .setLngLat(coords as [number, number])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredCompanies.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filteredCompanies.forEach(company => {
        const coords = getCompanyLngLat(company);
        if (coords) bounds.extend(coords);
      });
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 11, duration: 1000 });
    }

    console.log("✅ Markers added successfully");
  }, [filteredCompanies, mapLoaded]);

  // User location button handler
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.longitude, position.coords.latitude];
          
          // Add orange marker at user location
          new maplibregl.Marker({ color: '#FF6600' })
            .setLngLat(userCoords as [number, number])
            .addTo(map.current!);
          
          // Fly to user location
          map.current?.flyTo({
            center: userCoords as [number, number],
            zoom: 10,
            duration: 2000
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert('Locatie kon niet worden opgehaald. Zorg ervoor dat locatietoestemming is ingeschakeld.');
        }
      );
    } else {
      alert('Locatiefunctie wordt niet ondersteund door deze browser.');
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
                  className="w-full h-[60vh] md:h-[80vh] bg-gray-100"
                  style={{ minHeight: "400px" }}
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
              onRegionClick={setSelectedRegion}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveJobMap;
