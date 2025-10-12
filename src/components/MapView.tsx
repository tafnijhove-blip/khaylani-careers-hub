import { useEffect, useRef, useState, memo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { AlertCircle } from 'lucide-react';

interface Bedrijf {
  id: string;
  naam: string;
  regio: string;
  plaats: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
}

interface Vacature {
  id: string;
  functietitel: string;
  status: string;
  prioriteit: string;
  aantal_posities: number;
  bedrijf_id: string;
  vereisten: string[] | null;
  beloning: string | null;
  opmerkingen: string | null;
  datum_toegevoegd: string;
}

interface VacatureStat {
  id: string;
  posities_vervuld: number;
  posities_open: number;
}

interface MapViewProps {
  bedrijven: Bedrijf[];
  vacatures?: Vacature[];
  vacatureStats?: VacatureStat[];
  onBedrijfClick?: (bedrijf: Bedrijf) => void;
  onVacatureClick?: (vacature: Vacature) => void;
}

const MapView = ({ bedrijven, vacatures = [], vacatureStats = [], onBedrijfClick, onVacatureClick }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6.5);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const clusterIndex = useRef<Supercluster | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('MapView: Initializing MapLibre...');
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [5.2913, 52.1326],
        zoom: 6.5,
      });

      const currentMap = map.current;
      const handleResize = () => currentMap.resize();

      currentMap.on('load', () => {
        console.log('✓ MapView: Map loaded successfully');
        currentMap.scrollZoom.enable();
        currentMap.addControl(new maplibregl.NavigationControl(), 'top-right');
        setMapLoaded(true);
        setCurrentZoom(currentMap.getZoom());
        // Ensure proper sizing after initial render
        setTimeout(handleResize, 0);
      });

      // Listen to zoom changes for dynamic pin scaling
      currentMap.on('zoom', () => {
        setCurrentZoom(currentMap.getZoom());
      });

      window.addEventListener('resize', handleResize);

      currentMap.on('error', (e) => {
        console.error('✗ MapView: Map error:', e);
        setError(`Kaart fout: ${e.error?.message || 'Onbekende fout'}`);
      });

      return () => {
        console.log('MapView: Cleanup');
        try {
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];
        } catch (e) { /* ignore */ }
        window.removeEventListener('resize', handleResize);
        currentMap.remove();
        map.current = null;
        setMapLoaded(false);
      };
    } catch (err: any) {
      console.error('✗ MapView: Initialization error:', err);
      setError(`Fout bij aanmaken kaart: ${err.message}`);
    }
  }, []);

  // Calculate dynamic pin scale based on zoom level
  const getPinScale = useCallback((zoom: number): number => {
    // Base scale: 1.0 at zoom 7, scales between 0.6 and 1.5
    const baseZoom = 7;
    const minScale = 0.6;
    const maxScale = 1.5;
    const scale = minScale + ((zoom - 4) / 10) * (maxScale - minScale);
    return Math.max(minScale, Math.min(maxScale, scale));
  }, []);

  // Calculate dynamic sizes based on zoom and viewport
  const getDynamicSizes = useCallback((zoom: number) => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const scale = getPinScale(zoom);
    
    // Base sizes that scale with zoom
    const baseSizes = {
      maxWidth: isMobile ? 60 : isTablet ? 80 : 120,
      minWidth: isMobile ? 36 : isTablet ? 40 : 44,
      padding: isMobile ? 4 : isTablet ? 5 : 6,
      fontSize: isMobile ? 9 : isTablet ? 10 : 11,
      borderRadius: isMobile ? 14 : isTablet ? 16 : 20,
    };

    return {
      maxWidth: Math.round(baseSizes.maxWidth * scale),
      minWidth: Math.round(baseSizes.minWidth * scale),
      padding: Math.round(baseSizes.padding * scale),
      fontSize: Math.round(baseSizes.fontSize * scale),
      borderRadius: Math.round(baseSizes.borderRadius * scale),
    };
  }, [getPinScale]);

  // Helper to get company text based on zoom level
  const getCompanyText = useCallback((naam: string, zoom: number): string => {
    const isMobile = window.innerWidth < 768;
    
    // At lower zoom levels, use shorter abbreviations
    if (zoom < 6) {
      const words = naam.trim().split(/\s+/);
      return words.length === 1 
        ? naam.substring(0, 2).toUpperCase()
        : words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    }
    
    if (zoom < 8) {
      const words = naam.trim().split(/\s+/);
      const maxLength = isMobile ? 2 : 3;
      return words.length === 1
        ? naam.substring(0, Math.min(maxLength + 1, 4)).toUpperCase()
        : words.slice(0, maxLength).map(w => w.charAt(0)).join('').toUpperCase();
    }
    
    // At higher zoom, show more of the name
    if (zoom >= 9) {
      const maxChars = isMobile ? 8 : 12;
      return naam.length > maxChars ? naam.substring(0, maxChars) + '…' : naam;
    }
    
    // Medium zoom: abbreviation
    const words = naam.trim().split(/\s+/);
    const maxLength = isMobile ? 3 : 4;
    return words.length === 1
      ? naam.substring(0, Math.min(maxLength, 4)).toUpperCase()
      : words.slice(0, maxLength).map(w => w.charAt(0)).join('').toUpperCase();
  }, []);

  // Update markers when zoom changes
  const updateMarkerStyles = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    
    const zoom = currentZoom;
    const sizes = getDynamicSizes(zoom);
    
    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      const companyName = el.getAttribute('data-company-name');
      if (el && companyName) {
        const text = getCompanyText(companyName, zoom);
        el.textContent = text;
        el.style.maxWidth = `${sizes.maxWidth}px`;
        el.style.minWidth = `${sizes.minWidth}px`;
        el.style.padding = `${sizes.padding}px ${sizes.padding * 2}px`;
        el.style.fontSize = `${sizes.fontSize}px`;
        el.style.borderRadius = `${sizes.borderRadius}px`;
      }
    });
  }, [currentZoom, mapLoaded, getDynamicSizes, getCompanyText]);

  // Apply marker style updates when zoom changes
  useEffect(() => {
    updateMarkerStyles();
  }, [currentZoom, updateMarkerStyles]);

  // Create or update markers when data or map state changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    console.log('MapView: Rendering markers for', bedrijven.length, 'bedrijven');

    // Remove existing markers
    try {
      markersRef.current.forEach(m => m.remove());
    } catch (e) { /* ignore */ }
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    let added = 0;

    // Add custom styles for zoom-aware markers
    const styleId = 'map-marker-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .map-pin-badge {
          /* Dynamic sizing controlled via inline styles */
          height: auto;
          
          /* Badge styling */
          background: hsl(211 84% 31%);
          color: white;
          font-weight: 600;
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
          transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          
          /* Typography */
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        
        .map-pin-badge:hover {
          background: hsl(16 100% 60%);
          transform: translateY(-3px) scale(1.06);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3), 0 3px 6px rgba(0, 0, 0, 0.12);
        }
        
        .map-pin-badge.active {
          background: hsl(16 100% 60%);
          transform: scale(1.04);
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35);
        }
        
        .map-pin-cluster {
          background: hsl(16 100% 60%);
          color: white;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35), 0 2px 6px rgba(0, 0, 0, 0.15);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .map-pin-cluster:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4), 0 3px 8px rgba(0, 0, 0, 0.2);
        }
        
        .maplibregl-popup-content {
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 12px 48px rgba(11, 61, 145, 0.18), 0 4px 12px rgba(0, 0, 0, 0.12);
          border: 1px solid hsl(215 20% 88%);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .maplibregl-popup-tip {
          border-top-color: white;
        }
        
        .mv-vacature-item {
          transition: all 0.2s ease;
        }
        
        .mv-vacature-item:hover {
          background: hsl(211 84% 45%) !important;
          color: white !important;
          transform: translateX(4px);
        }
        
        .mv-vacature-item:hover .vacancy-badge {
          background: white !important;
          color: hsl(211 84% 45%) !important;
        }
        
        .maplibregl-marker {
          will-change: transform;
        }
      `;
      document.head.appendChild(style);
    }

    // Get initial dynamic sizes based on current zoom
    const sizes = getDynamicSizes(currentZoom);

    bedrijven.forEach((bedrijf) => {
      if (bedrijf.lat && bedrijf.lng) {
        // Get zoom-aware company text
        const displayText = getCompanyText(bedrijf.naam, currentZoom);
        
        // Create zoom-aware badge marker
        const el = document.createElement('div');
        el.className = 'map-pin-badge';
        el.textContent = displayText;
        el.style.maxWidth = `${sizes.maxWidth}px`;
        el.style.minWidth = `${sizes.minWidth}px`;
        el.style.padding = `${sizes.padding}px ${sizes.padding * 2}px`;
        el.style.fontSize = `${sizes.fontSize}px`;
        el.style.borderRadius = `${sizes.borderRadius}px`;
        el.setAttribute('data-company-name', bedrijf.naam);
        el.setAttribute('title', bedrijf.naam);
        el.setAttribute('aria-label', `${bedrijf.naam} - Klik voor details`);

        if (onBedrijfClick) {
          el.addEventListener('click', () => onBedrijfClick(bedrijf));
        }

        const bedrijfVacatures = vacatures.filter(v => v.bedrijf_id === bedrijf.id);
        const totalOpen = bedrijfVacatures.reduce((sum, v) => {
          const stat = vacatureStats.find(s => s.id === v.id);
          return sum + (stat?.posities_open ?? v.aantal_posities);
        }, 0);

        // Create enhanced popup
        const popupHtml = `
          <div style="padding: 18px; max-width: 320px;">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 14px;">
              <div style="flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, hsl(211 84% 31%), hsl(211 84% 45%)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(11, 61, 145, 0.2);">
                ${displayText}
              </div>
              <div style="flex: 1; min-width: 0;">
                <h3 style="font-weight: 700; font-size: 16px; margin: 0 0 4px 0; color: hsl(215 25% 15%); line-height: 1.3;">
                  ${bedrijf.naam}
                </h3>
                <p style="color: hsl(215 15% 45%); font-size: 13px; margin: 0; display: flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}</span>
                </p>
              </div>
            </div>
            
            <div style="border-top: 1px solid hsl(215 20% 88%); padding-top: 14px; margin-top: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 13px; font-weight: 600; color: hsl(215 15% 45%);">
                  Openstaande vacatures
                </span>
                <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 10px; border-radius: 8px; background: hsl(16 100% 60%); color: white; font-weight: 700; font-size: 14px;">
                  ${totalOpen}
                </span>
              </div>
              
              ${bedrijfVacatures.length ? `
                <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 8px;">
                  ${bedrijfVacatures.map(v => {
                    const stat = vacatureStats.find(s => s.id === v.id);
                    const open = (stat?.posities_open ?? v.aantal_posities);
                    return `
                      <li>
                        <a href="#" class="mv-vacature-item" data-id="${v.id}" style="
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          padding: 12px;
                          border-radius: 10px;
                          background: hsl(210 20% 96%);
                          text-decoration: none;
                          color: inherit;
                          gap: 12px;
                        ">
                          <span style="
                            font-size: 14px;
                            font-weight: 600;
                            color: hsl(215 25% 15%);
                            flex: 1;
                            min-width: 0;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                          ">${v.functietitel}</span>
                          <span class="vacancy-badge" style="
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            min-width: 32px;
                            padding: 4px 10px;
                            border-radius: 8px;
                            background: hsl(211 84% 31%);
                            color: white;
                            font-weight: 600;
                            font-size: 12px;
                            flex-shrink: 0;
                          ">${open}</span>
                        </a>
                      </li>
                    `;
                  }).join('')}
                </ul>
              ` : `
                <div style="
                  padding: 20px;
                  text-align: center;
                  color: hsl(215 15% 45%);
                  font-size: 13px;
                  background: hsl(210 20% 96%);
                  border-radius: 10px;
                ">
                  Geen openstaande vacatures
                </div>
              `}
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ 
          offset: 30,
          closeButton: true,
          closeOnClick: true,
          maxWidth: '340px'
        }).setHTML(popupHtml);

        popup.on('open', () => {
          el.classList.add('active');
          const popupEl = popup.getElement();
          if (!popupEl) return;
          
          popupEl.querySelectorAll('.mv-vacature-item').forEach((item) => {
            item.addEventListener('click', (e) => {
              e.preventDefault();
              const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
              const vac = bedrijfVacatures.find(v => v.id === id);
              if (vac && onVacatureClick) {
                onVacatureClick(vac);
                popup.remove();
              }
            }, { once: true });
          });
        });

        popup.on('close', () => {
          el.classList.remove('active');
        });

        const marker = new maplibregl.Marker(el)
          .setLngLat([bedrijf.lng, bedrijf.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([bedrijf.lng, bedrijf.lat]);
        added++;
      }
    });

    if (added > 0) {
      try {
        map.current!.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 1000 });
      } catch (e) {
        console.warn('MapView: fitBounds failed', e);
      }
    }

    // Cleanup styles on unmount
    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, [bedrijven, vacatures, vacatureStats, mapLoaded, onBedrijfClick, onVacatureClick, currentZoom, getDynamicSizes, getCompanyText]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kaart laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <p className="font-semibold mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              De kaart kan niet geladen worden. Probeer de pagina te verversen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-[480px] rounded-lg overflow-hidden" />
  );
};

export default memo(MapView);
