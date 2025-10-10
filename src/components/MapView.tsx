import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    // Check if token is in localStorage
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setTokenSaved(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !tokenSaved || !mapboxToken) return;
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
  }, [tokenSaved, mapboxToken, bedrijven, onBedrijfClick]);

  const handleSaveToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setTokenSaved(true);
    }
  };

  if (!tokenSaved) {
    return (
      <Card className="p-6 border-2">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Mapbox Token Vereist</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Om de interactieve kaart te gebruiken, heb je een gratis Mapbox account nodig:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 mb-4 list-decimal list-inside">
                <li>Ga naar <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a></li>
                <li>Maak een gratis account aan</li>
                <li>Kopieer je "Default public token" uit het dashboard</li>
                <li>Plak de token hieronder en klik op Opslaan</li>
              </ol>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="pk.eyJ1Ijoi..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={handleSaveToken} disabled={!mapboxToken.trim()}>
                  Opslaan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
    </div>
  );
};

export default MapView;
