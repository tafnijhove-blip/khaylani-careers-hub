import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vacancy {
  id: string;
  functietitel: string;
  status: string;
  aantal_posities: number;
}

interface Company {
  id: string;
  naam: string;
  lat: number | null;
  lng: number | null;
  regio: string;
  plaats?: string | null;
  vacatures?: Vacancy[];
}

interface MapboxDashboardMapProps {
  companies: Company[];
  selectedRegion?: string;
  minVacancies?: number;
  showHeatmap?: boolean;
  showTooltip?: boolean;
}

const MapboxDashboardMap = ({
  companies,
  selectedRegion = "all",
  minVacancies = 0,
  showHeatmap = false,
  showTooltip = true,
}: MapboxDashboardMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const NL_BOUNDS: [number, number, number, number] = [3.3, 50.7, 7.2, 53.6];

  const isWithinNetherlands = (lat: number, lng: number): boolean => {
    return lng >= NL_BOUNDS[0] && lng <= NL_BOUNDS[2] && lat >= NL_BOUNDS[1] && lat <= NL_BOUNDS[3];
  };

  const getCompanyLngLat = (company: Company): [number, number] | null => {
    const lat = company.lat;
    const lng = company.lng;
    
    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      return null;
    }

    const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
    const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;

    if (isNaN(latNum) || isNaN(lngNum)) return null;
    if (!isWithinNetherlands(latNum, lngNum)) return null;

    return [lngNum, latNum];
  };

  const filteredCompanies = companies.filter(company => {
    const coords = getCompanyLngLat(company);
    if (!coords) return false;

    const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
    const openVacancies = (company.vacatures || []).filter(v => v.status === "open").length;
    const vacancyMatch = openVacancies >= minVacancies;

    return regionMatch && vacancyMatch;
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token niet gevonden in environment variables");
      setMapLoaded(true); // Show error state
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [5.1214, 52.0907], // Centraal Nederland
        zoom: 6,
        pitch: 0,
        maxZoom: 12,
        minZoom: 4,
        renderWorldCopies: false,
        maxBounds: [
          [NL_BOUNDS[0] - 1, NL_BOUNDS[1] - 1],
          [NL_BOUNDS[2] + 1, NL_BOUNDS[3] + 1],
        ],
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setMapLoaded(true);
      });
    } catch (error) {
      console.error("Error initializing Mapbox:", error);
      setMapLoaded(true);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Fly to specific company
  const flyToCompany = useCallback((company: Company) => {
    const coords = getCompanyLngLat(company);
    if (!coords || !map.current) return;

    map.current.flyTo({
      center: coords,
      zoom: 12,
      duration: 2000,
      essential: true
    });
  }, []);

  // Add markers with realtime support
  const addMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredCompanies.forEach(company => {
      const coords = getCompanyLngLat(company);
      if (!coords) return;

      const vacancies = company.vacatures || [];
      const openVacancies = vacancies.filter(v => v.status === "open");
      const totalVacancies = openVacancies.length;

      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = totalVacancies > 0 ? "#00AEEF" : "#10b981";
      el.style.border = "3px solid white";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "bold";
      el.style.fontSize = "14px";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.textContent = totalVacancies.toString();

      // Simplified popup: only company name and vacancy count
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 16px; min-width: 220px; font-family: system-ui;">
          <h3 style="margin: 0 0 12px 0; font-weight: 700; color: #1a1a1a; font-size: 18px;">${company.naam}</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #00AEEF; color: white; padding: 6px 16px; border-radius: 16px; font-size: 14px; font-weight: 600;">
              ${totalVacancies} Open Vacature${totalVacancies !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to markers
    if (filteredCompanies.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredCompanies.forEach(company => {
        const coords = getCompanyLngLat(company);
        if (coords) bounds.extend(coords);
      });
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  }, [mapLoaded, filteredCompanies]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!mapLoaded) return;

    const channel = supabase
      .channel('bedrijven-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bedrijven'
        },
        (payload) => {
          console.log('Company changed:', payload);
          // Trigger re-render by updating a state
          addMarkers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapLoaded, addMarkers]);

  useEffect(() => {
    addMarkers();
  }, [addMarkers]);

  return (
    <Card className="relative overflow-hidden shadow-xl">
      {showTooltip && showHeatmap && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Heatmap Info</p>
              <p className="text-xs text-muted-foreground">
                Donkere gebieden tonen concentraties van vacatures. Klik op markers voor details.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <LoadingSpinner />
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-[600px]" />
      
      {mapLoaded && !map.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center p-6">
            <p className="text-lg font-medium text-muted-foreground mb-2">Kaart kon niet geladen worden</p>
            <p className="text-sm text-muted-foreground">Controleer of de Mapbox token correct is ingesteld</p>
          </div>
        </div>
      )}
      
      {mapLoaded && filteredCompanies.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Geen bedrijven gevonden</p>
            <p className="text-sm text-muted-foreground mt-2">Pas de filters aan om resultaten te zien</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MapboxDashboardMap;
export type { Company };
