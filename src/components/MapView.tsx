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

interface MapViewProps {
  bedrijven: Bedrijf[];
  onBedrijfClick?: (bedrijf: Bedrijf) => void;
}

const MapView = ({ bedrijven, onBedrijfClick }: MapViewProps) => {
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
        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3B82F6';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '18px';
        el.style.fontWeight = 'bold';
        el.style.color = 'white';
        el.style.transition = 'all 0.2s ease-in-out';
        el.textContent = bedrijf.naam.charAt(0).toUpperCase();

        // Add hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.backgroundColor = '#2563EB';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.backgroundColor = '#3B82F6';
        });

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${bedrijf.naam}</h3>
            <p style="color: #666; font-size: 14px;">${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}</p>
          </div>
        `);

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
  }, [loading, mapboxToken, bedrijven, onBedrijfClick]);

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
