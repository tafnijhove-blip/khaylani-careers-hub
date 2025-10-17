import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
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

type ClusterFeature = Supercluster.ClusterFeature<CompanyWithVacancies>;
type PointFeature = Supercluster.PointFeature<CompanyWithVacancies>;

const InteractiveJobMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const clusterIndexRef = useRef<Supercluster | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [minVacancies, setMinVacancies] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(7);

  // Netherlands bounds
  const NL_BOUNDS = {
    minLng: 3.2,
    maxLng: 7.3,
    minLat: 50.7,
    maxLat: 53.7,
  };

  const isWithinNetherlands = useCallback((lng: number, lat: number) =>
    lng >= NL_BOUNDS.minLng &&
    lng <= NL_BOUNDS.maxLng &&
    lat >= NL_BOUNDS.minLat &&
    lat <= NL_BOUNDS.maxLat,
  [NL_BOUNDS]);

  const getCompanyLngLat = useCallback((company: Company): [number, number] | null => {
    const rawLng = Number(company.lng);
    const rawLat = Number(company.lat);

    if (isWithinNetherlands(rawLng, rawLat)) return [rawLng, rawLat];
    if (isWithinNetherlands(rawLat, rawLng)) {
      console.warn(`Swapped coords for ${company.naam}`);
      return [rawLat, rawLng];
    }

    return null;
  }, [isWithinNetherlands]);

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
  }, [getCompanyLngLat, isWithinNetherlands]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
      const vacancyMatch = company.vacancyCount >= minVacancies;
      return regionMatch && vacancyMatch;
    });
  }, [companies, selectedRegion, minVacancies]);

  // Get unique regions
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

  // Initialize supercluster index
  useEffect(() => {
    if (filteredCompanies.length === 0) return;

    const points = filteredCompanies
      .map(company => {
        const coords = getCompanyLngLat(company);
        if (!coords) return null;
        
        return {
          type: 'Feature' as const,
          properties: company,
          geometry: {
            type: 'Point' as const,
            coordinates: coords
          }
        };
      })
      .filter(p => p !== null) as Supercluster.PointFeature<CompanyWithVacancies>[];

    const cluster = new Supercluster<CompanyWithVacancies>({
      radius: 60,
      maxZoom: 16,
      minZoom: 5,
    });

    cluster.load(points);
    clusterIndexRef.current = cluster;
  }, [filteredCompanies, getCompanyLngLat]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
          center: [5.2913, 52.1326],
          zoom: 7,
          minZoom: 5,
          maxZoom: 18
        });

        map.current = mapInstance;

        // Add province and city boundaries after map loads
        mapInstance.on('load', async () => {
          // Add province boundaries
          try {
            const response = await fetch('https://cartomap.github.io/nl/wgs84/provincie_2023.geojson');
            const provincesData = await response.json();

            mapInstance.addSource('provinces', {
              type: 'geojson',
              data: provincesData
            });

            // Province boundary lines
            mapInstance.addLayer({
              id: 'province-boundaries',
              type: 'line',
              source: 'provinces',
              paint: {
                'line-color': 'hsl(189, 70%, 48%)',
                'line-width': 2,
                'line-opacity': 0.6
              }
            });

            // Province fills (subtle)
            mapInstance.addLayer({
              id: 'province-fills',
              type: 'fill',
              source: 'provinces',
              paint: {
                'fill-color': 'hsl(189, 70%, 48%)',
                'fill-opacity': 0.05
              }
            }, 'province-boundaries');

            // Province labels
            mapInstance.addLayer({
              id: 'province-labels',
              type: 'symbol',
              source: 'provinces',
              layout: {
                'text-field': ['get', 'statnaam'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 14,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.1
              },
              paint: {
                'text-color': 'hsl(189, 70%, 38%)',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
                'text-halo-blur': 1
              }
            });
          } catch (error) {
            console.warn('Could not load province boundaries:', error);
          }

          // Add major city labels
          const cities = [
            { name: 'Amsterdam', coordinates: [4.9041, 52.3676] },
            { name: 'Rotterdam', coordinates: [4.4777, 51.9225] },
            { name: 'Den Haag', coordinates: [4.3007, 52.0705] },
            { name: 'Utrecht', coordinates: [5.1214, 52.0907] },
            { name: 'Eindhoven', coordinates: [5.4697, 51.4416] },
            { name: 'Groningen', coordinates: [6.5665, 53.2194] },
            { name: 'Maastricht', coordinates: [5.6889, 50.8514] },
            { name: 'Arnhem', coordinates: [5.8987, 51.9851] },
            { name: 'Nijmegen', coordinates: [5.8520, 51.8426] },
            { name: 'Enschede', coordinates: [6.8937, 52.2215] }
          ];

          mapInstance.addSource('cities', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: cities.map(city => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: city.coordinates
                },
                properties: {
                  name: city.name
                }
              }))
            }
          });

          // City dots
          mapInstance.addLayer({
            id: 'city-dots',
            type: 'circle',
            source: 'cities',
            paint: {
              'circle-radius': 4,
              'circle-color': 'hsl(25, 95%, 53%)',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // City labels
          mapInstance.addLayer({
            id: 'city-labels',
            type: 'symbol',
            source: 'cities',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
              'text-size': 12,
              'text-offset': [0, 1.5],
              'text-anchor': 'top'
            },
            paint: {
              'text-color': 'hsl(25, 95%, 43%)',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
              'text-halo-blur': 1
            }
          });

          setMapLoaded(true);
          mapInstance.resize();
        });

        mapInstance.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: false,
            visualizePitch: false
          }),
          "top-right"
        );

        if (window.innerWidth < 768) {
          mapInstance.scrollZoom.disable();
          mapInstance.doubleClickZoom.disable();
          mapInstance.touchZoomRotate.disable();
        }

        mapInstance.on("zoom", () => {
          setCurrentZoom(mapInstance.getZoom());
        });

        mapInstance.on("move", () => {
          setCurrentZoom(mapInstance.getZoom());
        });

        const handleResize = () => mapInstance.resize();
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          setMapLoaded(false);
          mapInstance.remove();
          map.current = null;
        };
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(initMap, 300);
    });
  }, []);

  // Create marker element
  const createMarkerElement = useCallback((
    company: CompanyWithVacancies,
    isCluster: boolean = false,
    clusterCount: number = 0
  ) => {
    const pinContainer = document.createElement("div");
    pinContainer.className = "map-pin-container";
    pinContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    if (isCluster) {
      // Cluster marker
      const clusterMarker = document.createElement("div");
      clusterMarker.style.cssText = `
        background: linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%));
        width: ${Math.min(50 + (clusterCount / 5), 70)}px;
        height: ${Math.min(50 + (clusterCount / 5), 70)}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(8, 211, 255, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: white;
        transition: all 0.2s;
      `;
      clusterMarker.textContent = clusterCount.toString();
      
      clusterMarker.addEventListener("mouseenter", () => {
        clusterMarker.style.transform = "scale(1.1)";
        clusterMarker.style.boxShadow = "0 6px 20px rgba(8, 211, 255, 0.6)";
      });
      
      clusterMarker.addEventListener("mouseleave", () => {
        clusterMarker.style.transform = "scale(1)";
        clusterMarker.style.boxShadow = "0 4px 12px rgba(8, 211, 255, 0.4)";
      });
      
      pinContainer.appendChild(clusterMarker);
    } else {
      // Company name label
      const nameLabel = document.createElement("div");
      nameLabel.style.cssText = `
        background: white;
        color: #000;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        margin-bottom: 4px;
        pointer-events: none;
        transition: all 0.2s;
      `;
      nameLabel.textContent = company.naam;

      // Pin marker
      const pin = document.createElement("div");
      pin.style.cssText = `
        background: linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%));
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(8, 211, 255, 0.4);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const countLabel = document.createElement("div");
      countLabel.style.cssText = `
        transform: rotate(45deg);
        font-size: 11px;
        font-weight: 700;
        color: white;
      `;
      countLabel.textContent = company.vacancyCount.toString();
      pin.appendChild(countLabel);

      pinContainer.appendChild(nameLabel);
      pinContainer.appendChild(pin);

      pinContainer.addEventListener("mouseenter", () => {
        pin.style.transform = "rotate(-45deg) scale(1.15)";
        pin.style.boxShadow = "0 4px 15px rgba(8, 211, 255, 0.6)";
        nameLabel.style.background = "linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%))";
        nameLabel.style.color = "white";
      });

      pinContainer.addEventListener("mouseleave", () => {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = "0 3px 10px rgba(8, 211, 255, 0.4)";
        nameLabel.style.background = "white";
        nameLabel.style.color = "#000";
      });
    }

    return pinContainer;
  }, []);

  // Update markers with clustering
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoaded || !clusterIndexRef.current) return;

    const mapInstance = map.current;
    const bounds = mapInstance.getBounds();
    const zoom = Math.floor(mapInstance.getZoom());

    const clusters = clusterIndexRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Remove markers that are no longer visible
    Object.keys(markersRef.current).forEach(id => {
      if (!clusters.find(c => String(c.id || c.properties.id) === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;
      const id = String(cluster.id || cluster.properties.id);

      if (markersRef.current[id]) return;

      let markerElement: HTMLElement;
      let popup: maplibregl.Popup | undefined;

      if (isCluster) {
        const clusterCount = cluster.properties.point_count;
        const expansionZoom = Math.min(
          clusterIndexRef.current!.getClusterExpansionZoom(cluster.id as number),
          18
        );

        markerElement = createMarkerElement(cluster.properties as CompanyWithVacancies, true, clusterCount);
        
        markerElement.addEventListener('click', () => {
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 1000
          });
        });
      } else {
        const company = cluster.properties as CompanyWithVacancies;
        markerElement = createMarkerElement(company);

        const popupHTML = `
          <div style="padding: 16px; min-width: 240px; font-family: 'Inter', sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b;">
              ${company.naam}
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
              📍 ${company.plaats || company.regio}
            </p>
            <p style="margin: 0 0 12px 0; font-size: 15px; background: linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 600;">
              ${company.vacancyCount} open ${company.vacancyCount === 1 ? 'vacature' : 'vacatures'}
            </p>
            <div style="margin-bottom: 16px;">
              ${company.vacancies.slice(0, 3).map(v => `
                <div style="padding: 6px 10px; background: hsl(240, 5%, 96%); border-radius: 6px; margin-bottom: 6px; font-size: 13px; color: #1e293b;">
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
                background: linear-gradient(135deg, hsl(189, 70%, 48%), hsl(25, 95%, 53%));
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
              "
              onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(8, 211, 255, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
            >
              Bekijk alle vacatures →
            </button>
          </div>
        `;

        popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          className: "map-popup"
        }).setHTML(popupHTML);
      }

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "bottom"
      })
        .setLngLat([lng, lat]);

      if (popup) {
        marker.setPopup(popup);
      }

      marker.addTo(mapInstance);
      markersRef.current[id] = marker;
    });
  }, [mapLoaded, createMarkerElement]);

  // Update markers on zoom/move
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    updateMarkers();

    const handleMapUpdate = () => {
      requestAnimationFrame(updateMarkers);
    };

    map.current.on("zoom", handleMapUpdate);
    map.current.on("move", handleMapUpdate);

    return () => {
      if (map.current) {
        map.current.off("zoom", handleMapUpdate);
        map.current.off("move", handleMapUpdate);
      }
    };
  }, [mapLoaded, updateMarkers]);

  // Fit bounds to filtered companies
  useEffect(() => {
    if (!map.current || !mapLoaded || filteredCompanies.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    filteredCompanies.forEach(company => {
      const coords = getCompanyLngLat(company);
      if (coords) bounds.extend(coords);
    });
    
    map.current.fitBounds(bounds, { 
      padding: 100, 
      maxZoom: 11, 
      duration: 1000 
    });
  }, [filteredCompanies, mapLoaded, getCompanyLngLat]);

  // User location handler
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.longitude, position.coords.latitude];
          
          new maplibregl.Marker({ color: '#FF6600' })
            .setLngLat(userCoords as [number, number])
            .addTo(map.current!);
          
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
      <Card className="h-[600px] flex items-center justify-center border shadow-lg">
        <LoadingSpinner size="lg" message="Kaart wordt geladen" />
      </Card>
    );
  }

  return (
    <div className="relative">
      <JobMapStats 
        totalVacancies={companies.reduce((sum, c) => sum + c.vacancyCount, 0)}
        totalCompanies={companies.length}
        regionalStats={regionalStats}
      />

      <Card className="relative h-[600px] overflow-hidden border shadow-xl hover-lift">
        <div ref={mapContainer} className="absolute inset-0" />
        
        <JobMapFilters
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          minVacancies={minVacancies}
          onMinVacanciesChange={setMinVacancies}
          onUseLocation={centerOnUserLocation}
        />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <LoadingSpinner size="lg" message="Kaart wordt geladen" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default InteractiveJobMap;