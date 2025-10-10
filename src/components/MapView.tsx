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

interface MapViewProps {
  bedrijven: Bedrijf[];
  vacatures?: Vacature[];
  onBedrijfClick?: (bedrijf: Bedrijf) => void;
}

const MapView = ({ bedrijven, vacatures = [], onBedrijfClick }: MapViewProps) => {
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
        
        // Create popup with detailed information
        let popupContent = `
          <div style="padding: 12px; max-width: 350px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1a1a1a;">${bedrijf.naam}</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
            </p>
        `;

        if (bedrijfVacatures.length > 0) {
          popupContent += `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <div style="display: flex; align-items: center; justify-between; margin-bottom: 8px;">
                <span style="font-weight: 600; font-size: 14px; color: #1a1a1a;">Vacatures (${bedrijfVacatures.length})</span>
              </div>
              <div style="max-height: 200px; overflow-y: auto;">
          `;

          bedrijfVacatures.forEach((vacature, index) => {
            const statusColors: Record<string, string> = {
              open: '#10b981',
              invulling: '#f59e0b',
              on_hold: '#f97316',
              gesloten: '#6b7280'
            };
            const priorityColors: Record<string, string> = {
              urgent: '#ef4444',
              hoog: '#f97316',
              normaal: '#3b82f6',
              laag: '#6b7280'
            };

            popupContent += `
              <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                  <span style="font-weight: 600; font-size: 13px; color: #1a1a1a;">${vacature.functietitel}</span>
                  <span style="background: ${priorityColors[vacature.prioriteit] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">${vacature.prioriteit}</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                  <span style="background: ${statusColors[vacature.status] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">${vacature.status}</span>
                  <span style="color: #6b7280; font-size: 12px;">${vacature.aantal_posities} positie(s)</span>
                </div>
            `;

            if (vacature.vereisten && vacature.vereisten.length > 0) {
              popupContent += `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                  <span style="font-size: 11px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 4px;">FUNCTIE-EISEN:</span>
                  <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #4b5563;">
              `;
              vacature.vereisten.forEach(vereiste => {
                popupContent += `<li style="margin-bottom: 2px;">${vereiste}</li>`;
              });
              popupContent += `</ul></div>`;
            }

            popupContent += `</div>`;
          });

          popupContent += `</div></div>`;
        } else {
          popupContent += `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <p style="color: #9ca3af; font-size: 13px; text-align: center;">Geen vacatures beschikbaar</p>
            </div>
          `;
        }

        popupContent += `</div>`;

        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '400px' }).setHTML(popupContent);

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
  }, [loading, mapboxToken, bedrijven, vacatures, onBedrijfClick]);

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
