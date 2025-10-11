import { useEffect, useRef, useState, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
  const markersRef = useRef<maplibregl.Marker[]>([]);

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
        currentMap.scrollZoom.disable();
        currentMap.addControl(new maplibregl.NavigationControl(), 'top-right');
        setMapLoaded(true);
        // Ensure proper sizing after initial render
        setTimeout(handleResize, 0);
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

        const bedrijfVacatures = vacatures.filter(v => v.bedrijf_id === bedrijf.id);

        const popupHtml = `
            <div style="padding:12px;max-width:280px">
              <h3 style="font-weight:600;margin-bottom:4px;">${bedrijf.naam}</h3>
              <p style="color:#666;font-size:12px;margin:0;">
                ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
              </p>
              <div style="margin-top:8px;border-top:1px solid #eee;padding-top:8px;">
                <div style="font-size:12px;color:#666;margin-bottom:6px;">Vacatures (${bedrijfVacatures.length})</div>
                ${bedrijfVacatures.length ? `
                  <ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px;">
                    ${bedrijfVacatures.map(v => {
                      const stat = vacatureStats.find(s => s.id === v.id);
                      const open = (stat?.posities_open ?? v.aantal_posities);
                      return `
                        <li>
                          <a href="#" class="mv-vacature-item" data-id="${v.id}" style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:#f6f7f9;text-decoration:none;color:inherit;">
                            <span style="font-size:13px;font-weight:600;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.functietitel}</span>
                            <span style="font-size:12px;background:#eef2ff;color:#1d4ed8;padding:2px 6px;border-radius:999px;">${open} open</span>
                          </a>
                        </li>
                      `;
                    }).join('')}
                  </ul>
                ` : `<div style="font-size:12px;color:#999;">Geen vacatures</div>`}
              </div>
            </div>
          `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);

        popup.on('open', () => {
          const el = popup.getElement();
          if (!el) return;
          el.querySelectorAll('.mv-vacature-item').forEach((item) => {
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
        map.current!.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
      } catch (e) {
        console.warn('MapView: fitBounds failed', e);
      }
    }
  }, [bedrijven, vacatures, vacatureStats, mapLoaded]);
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
