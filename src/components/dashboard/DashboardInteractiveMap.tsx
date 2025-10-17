import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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

interface DashboardInteractiveMapProps {
  companies: CompanyWithVacancies[];
  selectedRegion?: string;
  minVacancies?: number;
  showTooltip?: boolean;
}

const DashboardInteractiveMap = ({ 
  companies, 
  selectedRegion = "all", 
  minVacancies = 0,
  showTooltip = true
}: DashboardInteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const clusterIndexRef = useRef<Supercluster | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(7);

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
  []);

  const getCompanyLngLat = useCallback((company: Company): [number, number] | null => {
    const rawLng = Number(company.lng);
    const rawLat = Number(company.lat);

    if (isWithinNetherlands(rawLng, rawLat)) return [rawLng, rawLat];
    if (isWithinNetherlands(rawLat, rawLng)) return [rawLat, rawLng];
    return null;
  }, [isWithinNetherlands]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
      const vacancyMatch = company.vacancyCount >= minVacancies;
      return regionMatch && vacancyMatch;
    });
  }, [companies, selectedRegion, minVacancies]);

  // Initialize supercluster
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

        mapInstance.on("zoom", () => setCurrentZoom(mapInstance.getZoom()));
        mapInstance.on("move", () => setCurrentZoom(mapInstance.getZoom()));

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

  // Create markers
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
      pinContainer.appendChild(clusterMarker);
    } else {
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
    }

    return pinContainer;
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current || !mapLoaded || !clusterIndexRef.current) return;

    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());
    
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];

    const clusters = clusterIndexRef.current.getClusters(bbox, zoom);

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isClusterMarker = 'cluster' in cluster.properties && cluster.properties.cluster === true;
      
      if (isClusterMarker) {
        const clusterCount = (cluster.properties as any).point_count || 0;
        const element = createMarkerElement({} as CompanyWithVacancies, true, clusterCount);
        
        element.addEventListener("click", () => {
          const expansionZoom = clusterIndexRef.current!.getClusterExpansionZoom(cluster.properties.cluster_id);
          map.current!.flyTo({ center: [lng, lat], zoom: expansionZoom });
        });

        const marker = new maplibregl.Marker({ element })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        markersRef.current[`cluster-${cluster.properties.cluster_id}`] = marker;
      } else {
        const company = cluster.properties as CompanyWithVacancies;
        const element = createMarkerElement(company);

        const marker = new maplibregl.Marker({ element })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        markersRef.current[company.id] = marker;
      }
    });
  }, [mapLoaded, currentZoom, filteredCompanies, createMarkerElement]);

  return (
    <Card className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all">
      {showTooltip && (
        <div className="absolute top-4 left-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card p-2 rounded-full cursor-help">
                  <Info className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Klik op een cluster om in te zoomen. Individuele pins tonen klanten met het aantal openstaande vacatures.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <LoadingSpinner message="Kaart laden..." />
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        className="w-full h-[500px] md:h-[600px] rounded-lg"
        style={{ minHeight: "500px" }}
      />
    </Card>
  );
};

export default DashboardInteractiveMap;
