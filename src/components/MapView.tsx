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

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('MapView: Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('MapView: Error fetching token:', error);
          throw error;
        }
        if (data?.token) {
          console.log('MapView: Token received:', data.token.substring(0, 20) + '...');
          setMapboxToken(data.token);
        } else {
          throw new Error('Geen token ontvangen');
        }
      } catch (err: any) {
        console.error('MapView: Token fetch error:', err);
        setError('Fout bij ophalen van Mapbox token');
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || loading || !mapboxToken || map.current) {
      console.log('MapView: Skip init', { 
        hasContainer: !!mapContainer.current, 
        loading, 
        hasToken: !!mapboxToken,
        hasMap: !!map.current 
      });
      return;
    }

    console.log('MapView: Initializing map...');
    
    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [5.2913, 52.1326],
        zoom: 6.5,
      });

      const currentMap = map.current;
      console.log('MapView: Map instance created');

      currentMap.on('load', () => {
        console.log('✓ MapView: Map loaded successfully');
        currentMap.scrollZoom.disable();
        currentMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add markers
        bedrijven.forEach((bedrijf) => {
          if (bedrijf.lat && bedrijf.lng) {
            console.log('MapView: Adding marker for', bedrijf.naam);
            
            const el = document.createElement('div');
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#3B82F6';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.color = 'white';
            el.style.fontWeight = 'bold';
            el.style.fontSize = '14px';
            el.textContent = bedrijf.naam.charAt(0).toUpperCase();

            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px;">
                  <h3 style="font-weight: 600; margin-bottom: 6px;">${bedrijf.naam}</h3>
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
                  </p>
                </div>
              `);

            new mapboxgl.Marker(el)
              .setLngLat([bedrijf.lng, bedrijf.lat])
              .setPopup(popup)
              .addTo(currentMap);
          }
        });
      });

      currentMap.on('error', (e) => {
        console.error('✗ MapView: Mapbox error:', e);
        setError(`Mapbox fout: ${e.error?.message || 'Onbekende fout'}`);
      });

      return () => {
        console.log('MapView: Cleanup');
        currentMap.remove();
        map.current = null;
      };
    } catch (err: any) {
      console.error('✗ MapView: Initialization error:', err);
      setError(`Fout bij aanmaken kaart: ${err.message}`);
    }
  }, [mapboxToken, loading, bedrijven]);

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
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapView;
