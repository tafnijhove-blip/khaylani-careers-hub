import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
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
}

const MapView = ({ bedrijven, vacatures = [], vacatureStats = [], onBedrijfClick }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError('Mapbox token niet beschikbaar');
        }
      } catch (err: any) {
        console.error('Error fetching Mapbox token:', err);
        setError('Fout bij ophalen van Mapbox token');
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || loading || !mapboxToken) return;
    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [5.2913, 52.1326], // Center of Netherlands
      zoom: 6.5,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add markers for each bedrijf with coordinates
    bedrijven.forEach((bedrijf) => {
      if (bedrijf.lat && bedrijf.lng && map.current) {
        // Create a custom marker element (wrapper)
        const el = document.createElement('div');
        el.className = 'custom-marker-wrapper';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        // Inner visual marker (we scale this, not the wrapper)
        const inner = document.createElement('div');
        inner.style.width = '40px';
        inner.style.height = '40px';
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = '#3B82F6';
        inner.style.border = '3px solid white';
        inner.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        inner.style.display = 'flex';
        inner.style.alignItems = 'center';
        inner.style.justifyContent = 'center';
        inner.style.fontSize = '18px';
        inner.style.fontWeight = 'bold';
        inner.style.color = 'white';
        inner.style.transition = 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out';
        inner.textContent = bedrijf.naam.charAt(0).toUpperCase();

        el.appendChild(inner);

        // Hover effect without breaking mapbox transform
        el.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.15)';
          inner.style.backgroundColor = '#2563EB';
        });
        el.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
          inner.style.backgroundColor = '#3B82F6';
        });

        // Get vacatures for this bedrijf
        const bedrijfVacatures = vacatures.filter(v => v.bedrijf_id === bedrijf.id);
        
        // Create compact popup with limited height
        let popupContent = `
          <div style="padding: 10px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #1a1a1a;">${bedrijf.naam}</h3>
            <p style="color: #666; font-size: 12px; margin-bottom: 8px;">
              ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
            </p>
        `;

        if (bedrijfVacatures.length > 0) {
          const totalPosities = bedrijfVacatures.reduce((sum, v) => sum + v.aantal_posities, 0);
          const totalVervuld = bedrijfVacatures.reduce((sum, v) => {
            const stat = vacatureStats.find(vs => vs.id === v.id);
            return sum + (stat?.posities_vervuld || 0);
          }, 0);
          const totalOpen = totalPosities - totalVervuld;

          popupContent += `
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">
                ${bedrijfVacatures.length} Vacature${bedrijfVacatures.length > 1 ? 's' : ''}
              </div>
              <div style="display: flex; gap: 12px;">
                <span style="font-size: 11px; color: #059669; font-weight: 600;">✓ ${totalVervuld} vervuld</span>
                <span style="font-size: 11px; color: #f59e0b; font-weight: 600;">○ ${totalOpen} open</span>
              </div>
            </div>
            <div style="max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          `;

          bedrijfVacatures.slice(0, 3).forEach((vacature) => {
            const stat = vacatureStats.find(vs => vs.id === vacature.id);
            const vervuld = stat?.posities_vervuld || 0;
            const open = stat?.posities_open || vacature.aantal_posities;

            popupContent += `
              <div style="background: white; padding: 6px 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
                <div style="font-weight: 500; font-size: 12px; color: #1f2937; margin-bottom: 3px;">${vacature.functietitel}</div>
                <div style="display: flex; gap: 8px; font-size: 10px;">
                  <span style="color: #059669;">✓ ${vervuld}</span>
                  <span style="color: #f59e0b;">○ ${open}</span>
                </div>
              </div>
            `;
          });

          if (bedrijfVacatures.length > 3) {
            popupContent += `<div style="text-align: center; font-size: 11px; color: #6b7280; padding: 4px;">+${bedrijfVacatures.length - 3} meer...</div>`;
          }

          popupContent += `</div>`;
        } else {
          popupContent += `
            <div style="text-align: center; padding: 8px; color: #9ca3af; font-size: 12px;">
              Geen vacatures
            </div>
          `;
        }

        popupContent += `</div>`;

        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          maxWidth: '300px',
          closeButton: true,
          closeOnClick: false,
          className: 'compact-popup'
        }).setHTML(popupContent);

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([bedrijf.lng, bedrijf.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler
        el.addEventListener('click', () => {
          if (onBedrijfClick) {
            onBedrijfClick(bedrijf);
          }
        });
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [loading, mapboxToken, bedrijven, vacatures, vacatureStats, onBedrijfClick]);

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
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
    </div>
  );
};

export default MapView;
