import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";

const MapPreview = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Fictieve locaties voor demo
  const demoLocations = [
    { name: "TechCorp Amsterdam", city: "Amsterdam", lat: 52.3676, lng: 4.9041, count: 34, color: "#3b82f6" },
    { name: "InnovatieHub Rotterdam", city: "Rotterdam", lat: 51.9225, lng: 4.4792, count: 28, color: "#a855f7" },
    { name: "Digital Solutions Utrecht", city: "Utrecht", lat: 52.0907, lng: 5.1214, count: 21, color: "#22c55e" },
    { name: "StartUp Den Haag", city: "Den Haag", lat: 52.0705, lng: 4.3007, count: 18, color: "#f97316" },
    { name: "FinTech Eindhoven", city: "Eindhoven", lat: 51.4416, lng: 5.4697, count: 15, color: "#ec4899" },
    { name: "AI Labs Groningen", city: "Groningen", lat: 53.2194, lng: 6.5665, count: 11, color: "#06b6d4" }
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [5.2913, 52.1326], // Center of Netherlands
        zoom: 6.5,
      });

      const currentMap = map.current;

      currentMap.on('load', () => {
        setMapLoaded(true);
        currentMap.scrollZoom.disable();
        currentMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      });

      return () => {
        currentMap.remove();
      };
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    demoLocations.forEach((location, index) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${location.color};
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        position: relative;
        transition: transform 0.3s ease;
        animation: markerFadeIn 0.5s ease forwards;
        animation-delay: ${index * 0.1}s;
        opacity: 0;
      `;
      el.textContent = location.count.toString();

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup with more info
      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="padding: 12px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${location.color}; display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 14px; line-height: 1.2;">${location.name}</div>
              <div style="color: #666; font-size: 12px;">${location.city}</div>
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${location.color}" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span style="font-weight: 500;">${location.count} openstaande vacatures</span>
            </div>
          </div>
        </div>
      `);

      // Create marker
      const marker = new maplibregl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes markerFadeIn {
        from {
          opacity: 0;
          transform: scale(0.5) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .custom-popup .maplibregl-popup-content {
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 0;
      }
      .custom-popup .maplibregl-popup-tip {
        border-top-color: white;
      }
    `;
    document.head.appendChild(style);

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [mapLoaded]);

  const totalVacatures = demoLocations.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <Card className="relative h-[600px] glass-card overflow-hidden group">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map title overlay */}
      <div className="absolute top-6 left-6 z-10">
        <Badge variant="secondary" className="text-sm shadow-lg backdrop-blur-sm bg-background/95">
          <MapPin className="h-4 w-4 mr-2" />
          Nederland - Live Vacature Tracking
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-background/95 backdrop-blur-md rounded-xl p-4 border shadow-xl max-w-[250px]">
        <div className="text-xs font-semibold mb-3">Legenda</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-3 w-3 rounded-full bg-gradient-primary animate-pulse" />
            <span>Actieve vacatures per bedrijf</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Klik op een marker voor details</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-6 right-6 bg-background/95 backdrop-blur-md rounded-xl p-5 border shadow-xl max-w-[220px] z-10">
        <div className="text-sm font-bold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live overzicht
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bedrijven:</span>
            <span className="font-bold">{demoLocations.length}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vacatures:</span>
            <span className="font-bold text-primary">{totalVacatures}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Regio's:</span>
            <span className="font-bold">6</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recruiters:</span>
            <span className="font-bold">23</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Kaart laden...</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MapPreview;
