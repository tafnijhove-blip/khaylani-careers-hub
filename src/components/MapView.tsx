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
      cooperativeGestures: true,
    });

    // Disable map scroll zoom so popup scrolling works reliably
    map.current.scrollZoom.disable();

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
        
        // Create popup container
        const popupContainer = document.createElement('div');
        popupContainer.style.cssText = 'padding: 10px; max-width: 320px; max-height: 60vh; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; font-family: system-ui, -apple-system, sans-serif;';
        // Prevent the map from hijacking scroll inside the popup (capture phase)
        const stopEvent = (e: Event) => { e.stopPropagation(); (e as any).stopImmediatePropagation?.(); };
        popupContainer.addEventListener('wheel', stopEvent, { passive: true, capture: true });
        popupContainer.addEventListener('touchmove', stopEvent, { passive: true, capture: true });
        
        // Header
        const header = document.createElement('div');
        header.innerHTML = `
          <h3 style="font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #1a1a1a;">${bedrijf.naam}</h3>
          <p style="color: #666; font-size: 12px; margin-bottom: 8px;">
            ${bedrijf.regio}${bedrijf.plaats ? ` • ${bedrijf.plaats}` : ''}
          </p>
        `;
        popupContainer.appendChild(header);

        if (bedrijfVacatures.length > 0) {
          const totalPosities = bedrijfVacatures.reduce((sum, v) => sum + v.aantal_posities, 0);
          const totalVervuld = bedrijfVacatures.reduce((sum, v) => {
            const stat = vacatureStats.find(vs => vs.id === v.id);
            return sum + (stat?.posities_vervuld || 0);
          }, 0);
          const totalOpen = totalPosities - totalVervuld;

          // Summary box
          const summaryBox = document.createElement('div');
          summaryBox.style.cssText = 'background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 8px;';
          summaryBox.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">
              ${bedrijfVacatures.length} Vacature${bedrijfVacatures.length > 1 ? 's' : ''}
            </div>
            <div style="display: flex; gap: 12px;">
              <span style="font-size: 11px; color: #059669; font-weight: 600;">✓ ${totalVervuld} vervuld</span>
              <span style="font-size: 11px; color: #f59e0b; font-weight: 600;">○ ${totalOpen} open</span>
            </div>
          `;
          popupContainer.appendChild(summaryBox);

          // Vacatures container
          const vacaturesContainer = document.createElement('div');
          vacaturesContainer.style.cssText = 'max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;';

          // Make the list scroll independently of the page/map
          vacaturesContainer.style.overscrollBehavior = 'contain';
          vacaturesContainer.addEventListener('wheel', (e: WheelEvent) => {
            e.stopPropagation();
          }, { passive: true });
          vacaturesContainer.addEventListener('touchmove', (e: TouchEvent) => {
            e.stopPropagation();
          }, { passive: true });
          
          let showAll = false;
          const vacaturesToShow = bedrijfVacatures.slice(0, 3);

          const renderVacatures = () => {
            vacaturesContainer.innerHTML = '';
            const displayVacatures = showAll ? bedrijfVacatures : vacaturesToShow;
            
            displayVacatures.forEach((vacature) => {
              const stat = vacatureStats.find(vs => vs.id === vacature.id);
              const vervuld = stat?.posities_vervuld || 0;
              const open = stat?.posities_open || vacature.aantal_posities;

              const vacatureCard = document.createElement('div');
              vacatureCard.style.cssText = 'background: white; padding: 6px 8px; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.2s;';
              
              const cardContent = document.createElement('div');
              cardContent.innerHTML = `
                <div style="font-weight: 500; font-size: 12px; color: #1f2937; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
                  <span>${vacature.functietitel}</span>
                  <span style="font-size: 10px; color: #9ca3af;">▼</span>
                </div>
                <div style="display: flex; gap: 8px; font-size: 10px;">
                  <span style="color: #059669;">✓ ${vervuld}</span>
                  <span style="color: #f59e0b;">○ ${open}</span>
                </div>
              `;
              
              const detailsDiv = document.createElement('div');
              detailsDiv.style.cssText = 'max-height: 0; overflow: hidden; transition: max-height 0.3s ease; overscroll-behavior: contain;';

              // Ensure scroll inside details doesn't affect map
              const stopScroll = (e: Event) => { e.stopPropagation(); (e as any).stopImmediatePropagation?.(); };
              detailsDiv.addEventListener('wheel', stopScroll, { passive: true, capture: true });
              detailsDiv.addEventListener('touchmove', stopScroll, { passive: true, capture: true });
              
              if (vacature.vereisten && vacature.vereisten.length > 0) {
                detailsDiv.innerHTML = `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 10px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">FUNCTIE-EISEN:</div>
                    <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #4b5563; line-height: 1.4;">
                      ${vacature.vereisten.map(v => `<li style="margin-bottom: 2px;">${v}</li>`).join('')}
                    </ul>
                  </div>
                `;
              } else {
                detailsDiv.innerHTML = `
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; font-style: italic;">
                    Geen functie-eisen opgegeven
                  </div>
                `;
              }

              let isExpanded = false;
              vacatureCard.addEventListener('click', () => {
                isExpanded = !isExpanded;
                if (isExpanded) {
                  // Limit details to their own scroll area
                  detailsDiv.style.maxHeight = '220px';
                  detailsDiv.style.overflowY = 'auto';
                  (detailsDiv.style as any)['-webkit-overflow-scrolling'] = 'touch';
                  cardContent.querySelector('span:last-child')!.textContent = '▲';
                  vacatureCard.style.background = '#f9fafb';
                  
                  // Ensure expanded content is visible within the list
                  setTimeout(() => {
                    const cardRect = vacatureCard.getBoundingClientRect();
                    const containerRect = vacaturesContainer.getBoundingClientRect();
                    if (cardRect.bottom > containerRect.bottom) {
                      vacatureCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }, 50);
                } else {
                  detailsDiv.style.maxHeight = '0';
                  detailsDiv.style.overflow = 'hidden';
                  cardContent.querySelector('span:last-child')!.textContent = '▼';
                  vacatureCard.style.background = 'white';
                }
              });

              vacatureCard.addEventListener('mouseenter', () => {
                if (!isExpanded) {
                  vacatureCard.style.background = '#f9fafb';
                  vacatureCard.style.borderColor = '#d1d5db';
                }
              });

              vacatureCard.addEventListener('mouseleave', () => {
                if (!isExpanded) {
                  vacatureCard.style.background = 'white';
                  vacatureCard.style.borderColor = '#e5e7eb';
                }
              });

              vacatureCard.appendChild(cardContent);
              vacatureCard.appendChild(detailsDiv);
              vacaturesContainer.appendChild(vacatureCard);
            });

            if (bedrijfVacatures.length > 3) {
              const toggleButton = document.createElement('button');
              toggleButton.style.cssText = 'width: 100%; text-align: center; font-size: 11px; color: #3b82f6; padding: 6px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s;';
              toggleButton.textContent = showAll ? `Toon minder` : `Toon alle ${bedrijfVacatures.length} vacatures`;
              
              toggleButton.addEventListener('mouseenter', () => {
                toggleButton.style.background = '#dbeafe';
              });
              toggleButton.addEventListener('mouseleave', () => {
                toggleButton.style.background = '#eff6ff';
              });
              
              toggleButton.addEventListener('click', () => {
                showAll = !showAll;
                renderVacatures();
              });
              
              vacaturesContainer.appendChild(toggleButton);
            }
          };

          renderVacatures();
          popupContainer.appendChild(vacaturesContainer);
        } else {
          const noVacatures = document.createElement('div');
          noVacatures.style.cssText = 'text-align: center; padding: 8px; color: #9ca3af; font-size: 12px;';
          noVacatures.textContent = 'Geen vacatures';
          popupContainer.appendChild(noVacatures);
        }

        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          maxWidth: '350px',
          closeButton: true,
          closeOnClick: false,
          className: 'interactive-popup'
        }).setDOMContent(popupContainer);

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
