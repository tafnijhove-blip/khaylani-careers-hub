import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";

const MapPreview = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6.5);
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
        setCurrentZoom(currentMap.getZoom());
        currentMap.scrollZoom.enable();
        currentMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      });

      // Listen to zoom changes
      currentMap.on('zoom', () => {
        setCurrentZoom(currentMap.getZoom());
      });

      return () => {
        currentMap.remove();
      };
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  // Calculate dynamic pin scale based on zoom (subtle scaling only)
  const getPinScale = useCallback((zoom: number): number => {
    const minScale = 0.85;
    const maxScale = 1.0;
    const scale = minScale + ((zoom - 4) / 10) * (maxScale - minScale);
    return Math.max(minScale, Math.min(maxScale, scale));
  }, []);

  // Calculate fixed sizes based on viewport only (not affected by zoom)
  const getFixedSizes = useCallback(() => {
    const width = window.innerWidth;
    
    // Fixed maximum widths that never exceed these values
    if (width < 360) {
      return { maxWidth: 50, height: 28, padding: 6, fontSize: 9, borderRadius: 14 };
    } else if (width < 768) {
      return { maxWidth: 60, height: 32, padding: 6, fontSize: 10, borderRadius: 16 };
    } else if (width < 1024) {
      return { maxWidth: 80, height: 36, padding: 8, fontSize: 11, borderRadius: 18 };
    } else {
      return { maxWidth: 120, height: 40, padding: 10, fontSize: 12, borderRadius: 20 };
    }
  }, []);

  // Get company text based on zoom level and viewport
  const getCompanyText = useCallback((name: string, zoom: number): string => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    
    // Generate abbreviation from company name
    const words = name.trim().split(/\s+/);
    const abbreviation = words.length === 1 
      ? name.substring(0, 2).toUpperCase()
      : words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    
    // At very low zoom or mobile, always show abbreviation
    if (zoom < 6 || (isMobile && zoom < 7)) {
      return abbreviation;
    }
    
    // At medium zoom, show slightly longer abbreviation or short name
    if (zoom < 8) {
      const maxChars = isMobile ? 3 : 5;
      return name.length <= maxChars ? name : abbreviation;
    }
    
    // At higher zoom, show full name with truncation
    const maxChars = isMobile ? 6 : width < 1024 ? 8 : 12;
    return name.length > maxChars ? name.substring(0, maxChars) + '…' : name;
  }, []);

  // Update marker styles when zoom changes
  const updateMarkerStyles = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    
    const zoom = currentZoom;
    const sizes = getFixedSizes();
    const scale = getPinScale(zoom);
    
    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      const companyName = el.getAttribute('data-company-name');
      if (el && companyName) {
        const text = getCompanyText(companyName, zoom);
        el.textContent = text;
        // Fixed max width, slight scale on zoom for emphasis only
        el.style.maxWidth = `${sizes.maxWidth}px`;
        el.style.width = `fit-content`;
        el.style.height = `${sizes.height}px`;
        el.style.padding = `0 ${sizes.padding}px`;
        el.style.fontSize = `${sizes.fontSize}px`;
        el.style.borderRadius = `${sizes.borderRadius}px`;
        el.style.transform = `scale(${scale})`;
      }
    });
  }, [currentZoom, mapLoaded, getFixedSizes, getPinScale, getCompanyText]);

  // Apply updates when zoom changes
  useEffect(() => {
    updateMarkerStyles();
  }, [currentZoom, updateMarkerStyles]);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add custom styles with zoom awareness
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
        /* Fixed sizing - never stretches */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: fit-content;
        box-sizing: border-box;
        
        /* Badge styling */
        background: hsl(211 84% 31%);
        color: white;
        font-weight: 600;
        letter-spacing: 0.3px;
        line-height: 1;
        text-align: center;
        
        /* Text handling - strict truncation */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        /* Visual effects */
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(11, 61, 145, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08);
        border: 2px solid white;
        transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center;
        
        /* Typography */
        font-family: 'Inter', -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
        
        /* Animation */
        animation: markerFadeIn 0.5s ease forwards;
        opacity: 0;
      }
      
      .landing-pin-badge:hover {
        background: hsl(16 100% 60%);
        transform: translateY(-3px) scale(1.08);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3), 0 3px 6px rgba(0, 0, 0, 0.12);
        z-index: 1;
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
      
      .maplibregl-marker {
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    // Get fixed sizes based on viewport
    const sizes = getFixedSizes();
    const scale = getPinScale(currentZoom);

    demoLocations.forEach((location, index) => {
      // Get zoom-aware company text
      const displayText = getCompanyText(location.name, currentZoom);
      
      // Create fixed-size badge marker
      const el = document.createElement('div');
      el.className = 'landing-pin-badge';
      el.style.animationDelay = `${index * 0.1}s`;
      el.style.maxWidth = `${sizes.maxWidth}px`;
      el.style.width = 'fit-content';
      el.style.height = `${sizes.height}px`;
      el.style.padding = `0 ${sizes.padding}px`;
      el.style.fontSize = `${sizes.fontSize}px`;
      el.style.borderRadius = `${sizes.borderRadius}px`;
      el.style.transform = `scale(${scale})`;
      el.textContent = displayText;
      el.setAttribute('data-company-name', location.name);
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
                ${displayText}
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
  }, [mapLoaded, currentZoom, getFixedSizes, getPinScale, getCompanyText]);

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
