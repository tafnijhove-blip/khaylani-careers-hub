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

  // Helper function to create company abbreviation (responsive)
  const getCompanyAbbreviation = (name: string, maxLength: number = 4): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return name.substring(0, Math.min(maxLength, 4)).toUpperCase();
    }
    // Take first letter of words based on maxLength
    const numWords = Math.min(words.length, maxLength);
    return words.slice(0, numWords)
      .map(w => w.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add custom styles with fixed-size constraints
    const styleId = 'landing-map-styles';
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes markerFadeIn {
        from {
          opacity: 0;
          transform: scale(0.7) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .landing-pin-badge {
        /* Fixed size constraints - responsive */
        max-width: 120px;
        min-width: 44px;
        height: auto;
        padding: 6px 12px;
        
        /* Badge styling */
        border-radius: 20px;
        background: hsl(211 84% 31%);
        color: white;
        font-weight: 600;
        font-size: 11px;
        letter-spacing: 0.3px;
        line-height: 1.4;
        text-align: center;
        
        /* Text handling */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        /* Visual effects */
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(11, 61, 145, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08);
        border: 2px solid white;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        
        /* Typography */
        font-family: 'Inter', -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
        
        /* Animation */
        animation: markerFadeIn 0.5s ease forwards;
        opacity: 0;
      }
      
      /* Tablet breakpoint */
      @media (max-width: 1024px) {
        .landing-pin-badge {
          max-width: 80px;
          min-width: 40px;
          padding: 5px 10px;
          font-size: 10px;
          border-radius: 16px;
        }
      }
      
      /* Mobile breakpoint */
      @media (max-width: 768px) {
        .landing-pin-badge {
          max-width: 60px;
          min-width: 36px;
          padding: 4px 8px;
          font-size: 9px;
          border-radius: 14px;
          border-width: 1.5px;
        }
      }
      
      .landing-pin-badge:hover {
        background: hsl(16 100% 60%);
        transform: translateY(-3px) scale(1.06);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3), 0 3px 6px rgba(0, 0, 0, 0.12);
      }
      
      .landing-popup .maplibregl-popup-content {
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 12px 48px rgba(11, 61, 145, 0.18), 0 4px 12px rgba(0, 0, 0, 0.12);
        border: 1px solid hsl(215 20% 88%);
        font-family: 'Inter', -apple-system, sans-serif;
      }
      
      .landing-popup .maplibregl-popup-tip {
        border-top-color: white;
      }
      
      /* Marker container ensures proper centering */
      .maplibregl-marker {
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    demoLocations.forEach((location, index) => {
      // Get responsive abbreviation (shorter on mobile)
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const maxLength = isMobile ? 2 : isTablet ? 3 : 4;
      const abbreviation = getCompanyAbbreviation(location.name, maxLength);
      
      // Create fixed-size badge marker
      const el = document.createElement('div');
      el.className = 'landing-pin-badge';
      el.style.animationDelay = `${index * 0.1}s`;
      el.textContent = abbreviation;
      el.setAttribute('title', location.name);
      el.setAttribute('aria-label', `${location.name} - ${location.count} vacatures`);

      // Create enhanced popup
      const popup = new maplibregl.Popup({ 
        offset: 30,
        closeButton: true,
        className: 'landing-popup',
        maxWidth: '280px'
      }).setHTML(`
        <div style="padding: 18px;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 14px;">
            <div style="
              flex-shrink: 0;
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: linear-gradient(135deg, hsl(211 84% 31%), hsl(211 84% 45%));
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 15px;
              box-shadow: 0 4px 12px rgba(11, 61, 145, 0.2);
            ">
              ${abbreviation}
            </div>
            <div style="flex: 1; min-width: 0;">
              <h3 style="font-weight: 700; font-size: 15px; margin: 0 0 4px 0; color: hsl(215 25% 15%); line-height: 1.3;">
                ${location.name}
              </h3>
              <p style="color: hsl(215 15% 45%); font-size: 12px; margin: 0; display: flex; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${location.city}</span>
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid hsl(215 20% 88%); padding-top: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 13px; font-weight: 600; color: hsl(215 15% 45%);">
                Openstaande vacatures
              </span>
              <span style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
                padding: 0 10px;
                border-radius: 8px;
                background: hsl(16 100% 60%);
                color: white;
                font-weight: 700;
                font-size: 14px;
              ">
                ${location.count}
              </span>
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
