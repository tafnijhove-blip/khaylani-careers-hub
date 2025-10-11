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
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('🗺️ MapView: Starting token fetch...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        console.log('🗺️ MapView: Response received', { data, error });
        
        if (error) {
          console.error('❌ MapView: Error fetching token:', error);
          throw error;
        }
        if (data?.token) {
          console.log('✅ MapView: Token received successfully:', data.token.substring(0, 20) + '...');
          setMapboxToken(data.token);
        } else {
          console.error('❌ MapView: No token in response');
          throw new Error('Geen token ontvangen');
        }
      } catch (err: any) {
        console.error('❌ MapView: Token fetch error:', err);
        setError(`Fout bij ophalen van Mapbox token: ${err.message || 'Onbekende fout'}`);
      } finally {
        console.log('🗺️ MapView: Token fetch completed');
        setLoading(false);
      }
    };

    console.log('🗺️ MapView: Component mounted, starting fetch...');
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
        setMapLoaded(true);
      });

      currentMap.on('error', (e) => {
        console.error('✗ MapView: Mapbox error:', e);
        setError(`Mapbox fout: ${e.error?.message || 'Onbekende fout'}`);
      });

      return () => {
        console.log('MapView: Cleanup');
        try {
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];
        } catch (e) { /* ignore */ }
        currentMap.remove();
        map.current = null;
        setMapLoaded(false);
      };
    } catch (err: any) {
      console.error('✗ MapView: Initialization error:', err);
      setError(`Fout bij aanmaken kaart: ${err.message}`);
    }
  }, [mapboxToken, loading]);

  // Create or update markers when data or map state changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    console.log('MapView: Rendering markers for', bedrijven.length, 'bedrijven');

    // Remove existing markers
    try {
      markersRef.current.forEach(m => m.remove());
    } catch (e) { /* ignore */ }
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let added = 0;

    bedrijven.forEach((bedrijf) => {
      if (bedrijf.lat && bedrijf.lng) {
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

        if (onBedrijfClick) {
          el.addEventListener('click', () => onBedrijfClick(bedrijf));
        }

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 12px;">
              <h3 style="font-weight: 600; margin-bottom: 6px;">${bedrijf.naam}</h3>
              <p style="color: #666; font-size: 12px; margin: 0;">
                ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
              </p>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
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
        map.current!.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
      } catch (e) {
        console.warn('MapView: fitBounds failed', e);
      }
    }
  }, [bedrijven, mapLoaded]);
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
