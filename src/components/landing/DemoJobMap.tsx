import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

// Static local company data
const companies = [
  { 
    id: 1,
    name: "Khaylani Recruitment", 
    vacancies: 8, 
    lat: 52.3676, 
    lng: 4.9041,
    city: "Amsterdam"
  },
  { 
    id: 2,
    name: "FutureHire BV", 
    vacancies: 3, 
    lat: 51.9244, 
    lng: 4.4777,
    city: "Rotterdam"
  },
  { 
    id: 3,
    name: "SkyTalent Group", 
    vacancies: 6, 
    lat: 52.0907, 
    lng: 5.1214,
    city: "Utrecht"
  },
  { 
    id: 4,
    name: "TechForce Nederland", 
    vacancies: 5, 
    lat: 52.3731, 
    lng: 4.8937,
    city: "Amsterdam"
  },
  { 
    id: 5,
    name: "Digital Talents", 
    vacancies: 4, 
    lat: 51.9225, 
    lng: 4.4792,
    city: "Rotterdam"
  },
  { 
    id: 6,
    name: "DevMasters BV", 
    vacancies: 7, 
    lat: 52.0808, 
    lng: 4.3121,
    city: "Den Haag"
  },
  { 
    id: 7,
    name: "CodeCrafters", 
    vacancies: 6, 
    lat: 52.0907, 
    lng: 5.1214,
    city: "Utrecht"
  },
  { 
    id: 8,
    name: "IT Solutions Group", 
    vacancies: 2, 
    lat: 51.4416, 
    lng: 5.4797,
    city: "Eindhoven"
  },
];

const DemoJobMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    try {
      // Initialize map
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [5.2913, 52.1326], // Center of Netherlands
        zoom: 7,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        if (!map.current) return;

        // Add markers for each company
        companies.forEach((company) => {
          if (!map.current) return;

          // Create marker element with label
          const el = document.createElement('div');
          el.className = 'company-marker';
          el.innerHTML = `
            <div class="marker-pin"></div>
            <div class="marker-label">${company.name}</div>
          `;

          // Create popup
          const popup = new maplibregl.Popup({ offset: 25, closeButton: true })
            .setHTML(`
              <div class="map-popup">
                <h3 class="popup-title">${company.name}</h3>
                <p class="popup-city"><svg class="popup-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${company.city}</p>
                <p class="popup-vacancies">${company.vacancies} open vacature${company.vacancies !== 1 ? 's' : ''}</p>
                <button class="popup-button" onclick="document.getElementById('offerte')?.scrollIntoView({ behavior: 'smooth' })">
                  Bekijk alle vacatures
                </button>
              </div>
            `);

          // Create and add marker
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([company.lng, company.lat])
            .setPopup(popup)
            .addTo(map.current);

          markersRef.current.push(marker);
        });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Kaart kon niet worden geladen, ververs de pagina.');
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Kaart kon niet worden geladen, ververs de pagina.');
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Locatiefunctie wordt niet ondersteund door deze browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!map.current) return;
        
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];

        // Fly to user location
        map.current.flyTo({
          center: userCoords,
          zoom: 13,
          duration: 2000
        });

        // Add user location marker
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.innerHTML = '<div class="user-location-pulse"></div>';

        new maplibregl.Marker({ element: el })
          .setLngLat(userCoords)
          .addTo(map.current);

        setIsLocating(false);
      },
      () => {
        alert('Locatie kon niet worden opgehaald.');
        setIsLocating(false);
      }
    );
  };

  if (mapError) {
    return (
      <Card className="w-full h-[600px] md:h-[400px] flex items-center justify-center bg-muted">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{mapError}</p>
        </div>
      </Card>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background via-background to-primary/5 rounded-xl">
      {/* CTA Banner */}
      <div className="container mx-auto px-4 mb-8">
        <Card className="bg-gradient-primary text-white p-8 text-center border-0 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ontdek waar je klanten de meeste vacatures hebben
          </h2>
          <p className="text-lg mb-6 text-white/90 max-w-2xl mx-auto">
            Interactieve kaart met real-time vacaturedata per regio
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => document.getElementById('offerte')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Probeer Khaylani
          </Button>
        </Card>
      </div>

      {/* Map Container */}
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden border-2 shadow-2xl rounded-xl relative">
          {/* Use My Location Button */}
          <Button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="absolute top-4 left-4 z-[1000] shadow-xl gap-2"
            size="sm"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
            📍 Gebruik mijn locatie
          </Button>

          <div 
            ref={mapContainer} 
            className="w-full h-[600px] md:h-[600px] sm:h-[400px]"
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border-2 z-[1000]">
            <h4 className="font-semibold text-sm mb-3 text-foreground">Legenda</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Bedrijven met vacatures</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Klik op een marker voor details</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats below map */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {companies.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Bedrijven op de kaart
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {companies.reduce((sum, c) => sum + c.vacancies, 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Vacatures
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {Math.round(companies.reduce((sum, c) => sum + c.vacancies, 0) / companies.length)}
            </div>
            <div className="text-sm text-muted-foreground">
              Gemiddeld vacatures per bedrijf
            </div>
          </Card>
        </div>
      </div>

      {/* Custom CSS for map styling */}
      <style>{`
        .company-marker {
          position: relative;
          cursor: pointer;
        }
        
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: hsl(var(--primary));
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }

        .company-marker:hover .marker-pin {
          transform: rotate(-45deg) scale(1.2);
        }
        
        .marker-label {
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          pointer-events: none;
        }

        .user-location-marker {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .user-location-pulse {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FF6600;
          border: 3px solid white;
          box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.7);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(255, 102, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 102, 0, 0);
          }
        }
        
        .map-popup {
          padding: 16px;
          min-width: 200px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .popup-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: hsl(var(--foreground));
        }
        
        .popup-city {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: hsl(var(--muted-foreground));
          margin: 0 0 8px 0;
        }

        .popup-icon {
          width: 16px;
          height: 16px;
        }
        
        .popup-vacancies {
          font-size: 15px;
          font-weight: 600;
          color: hsl(var(--primary));
          margin: 0 0 12px 0;
        }
        
        .popup-button {
          width: 100%;
          padding: 8px 16px;
          background: hsl(var(--primary));
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .popup-button:hover {
          background: hsl(var(--primary) / 0.9);
        }

        .maplibregl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .maplibregl-popup-close-button {
          font-size: 24px;
          padding: 8px;
          color: hsl(var(--foreground));
        }

        @media (max-width: 640px) {
          .company-marker {
            transform: scale(0.85);
          }
          
          .marker-label {
            font-size: 10px;
            padding: 3px 6px;
          }
        }
      `}</style>
    </section>
  );
};

export default DemoJobMap;
