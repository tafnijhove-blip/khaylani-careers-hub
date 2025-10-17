import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
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

interface LeafletDashboardMapProps {
  companies: CompanyWithVacancies[];
  selectedRegion?: string;
  minVacancies?: number;
  showTooltip?: boolean;
  showHeatmap?: boolean;
}

const LeafletDashboardMap = ({
  companies,
  selectedRegion = "all",
  minVacancies = 0,
  showTooltip = true,
  showHeatmap = true,
}: LeafletDashboardMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // Filter companies
  const filteredCompanies = companies.filter((company) => {
    const regionMatch = selectedRegion === "all" || company.regio === selectedRegion;
    const vacancyMatch = company.vacancyCount >= minVacancies;
    return regionMatch && vacancyMatch;
  });

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
        setMapLoaded(true);
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
    if (!mapRef.current || !markersLayerRef.current || !mapLoaded) return;

    // Clear existing layers
    markersLayerRef.current.clearLayers();
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
      if (showHeatmap) {
        heatPoints.push([coords[0], coords[1], company.vacancyCount]);
      }

      // Custom marker
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

      const popupContent = `
        <div style="padding: 8px;">
          <h3 style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">${company.naam}</h3>
          <p style="color: #666; margin-bottom: 4px;">${company.regio}</p>
          <p style="font-weight: 600; color: hsl(189, 70%, 48%);">${company.vacancyCount} openstaande vacature${company.vacancyCount !== 1 ? "s" : ""}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current!.addLayer(marker);
    });

    // Add heatmap
    if (showHeatmap && heatPoints.length > 0) {
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
  }, [filteredCompanies, mapLoaded, showHeatmap]);

  return (
    <Card className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all">
      {showTooltip && (
        <div className="absolute top-4 left-4 z-[1000]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card p-2 rounded-full cursor-help">
                  <Info className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  De heatmap toont teamactiviteit per regio. Donkere kleuren = veel activiteit, lichte kleuren = kansen.
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
        ref={mapContainerRef}
        className="w-full h-[500px] md:h-[600px] rounded-lg"
        style={{ minHeight: "500px" }}
      />
    </Card>
  );
};

export default LeafletDashboardMap;
