import { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Fix Leaflet default icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Company {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lon: number };
  logoUrl: string | null;
  openVacancyCount: number;
}

interface Job {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  type: string;
  remote: string;
  detailSlug: string;
}

interface MapData {
  companies: Company[];
  jobs: Job[];
}

// Auto-resize map when loaded
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Delay to ensure container is visible
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
}

const DemoJobMap = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch demo data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/demo/map.json");
        const data = await response.json();
        setMapData(data);
      } catch (error) {
        console.error("Error loading demo map data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group jobs by company
  const jobsByCompany = useMemo(() => {
    if (!mapData) return {};
    
    const grouped: Record<string, Job[]> = {};
    mapData.jobs.forEach((job) => {
      if (!grouped[job.companyId]) {
        grouped[job.companyId] = [];
      }
      grouped[job.companyId].push(job);
    });
    return grouped;
  }, [mapData]);

  // Custom cluster icon
  const createClusterCustomIcon = useCallback((cluster: any) => {
    const count = cluster.getChildCount();
    let size = "small";
    if (count > 10) size = "large";
    else if (count > 5) size = "medium";

    return L.divIcon({
      html: `<div class="cluster-marker cluster-${size}">${count}</div>`,
      className: "custom-cluster-icon",
      iconSize: L.point(40, 40, true),
    });
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 rounded-xl">
        <LoadingSpinner size="lg" message="Laden van vacaturekaart..." />
      </div>
    );
  }

  if (!mapData || mapData.companies.length === 0) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">Geen vacaturedata beschikbaar</p>
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
        <Card className="overflow-hidden border-2 shadow-2xl rounded-xl">
          <div className="w-full h-[60vh] md:h-[80vh] relative" style={{ minHeight: "500px" }}>
            <MapContainer
              center={[52.1326, 5.2913]}
              zoom={7}
              scrollWheelZoom={true}
              className="h-full w-full"
              style={{ zIndex: 0 }}
            >
              <MapResizer />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterCustomIcon}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                maxClusterRadius={60}
              >
                {mapData.companies.map((company) => {
                  const companyJobs = jobsByCompany[company.id] || [];
                  
                  return (
                    <Marker
                      key={company.id}
                      position={[company.location.lat, company.location.lon]}
                      title={company.name}
                    >
                      <Popup maxWidth={320} minWidth={280}>
                        <div className="p-4 font-sans">
                          <h3 className="text-xl font-bold mb-2 text-foreground">
                            {company.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {company.address}
                          </p>
                          <p className="text-base font-semibold text-primary mb-4">
                            {company.openVacancyCount} open {company.openVacancyCount === 1 ? 'vacature' : 'vacatures'}
                          </p>
                          
                          {companyJobs.length > 0 && (
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                              {companyJobs.slice(0, 5).map((job) => (
                                <div
                                  key={job.id}
                                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                  <div className="font-semibold text-sm text-foreground mb-1">
                                    {job.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {job.type} · {job.remote}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-2">
                                    {job.summary}
                                  </div>
                                </div>
                              ))}
                              {companyJobs.length > 5 && (
                                <p className="text-xs text-muted-foreground italic text-center">
                                  +{companyJobs.length - 5} meer...
                                </p>
                              )}
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => document.getElementById('offerte')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Vraag een demo aan
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border-2 z-[1000]">
              <h4 className="font-semibold text-sm mb-3 text-foreground">Legenda</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Bedrijven met vacatures</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="cluster-marker cluster-small" style={{width: '24px', height: '24px', fontSize: '10px'}}>5</div>
                  <span>Meerdere bedrijven (klik om uit te klappen)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Klik op een marker voor details</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats below map */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {mapData.companies.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Bedrijven op de kaart
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {mapData.jobs.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Totaal vacatures
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {Math.round(mapData.jobs.length / mapData.companies.length)}
            </div>
            <div className="text-sm text-muted-foreground">
              Gemiddeld vacatures per bedrijf
            </div>
          </Card>
        </div>
      </div>

      {/* Custom CSS for cluster styling */}
      <style>{`
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }
        
        .cluster-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s;
        }
        
        .cluster-marker:hover {
          transform: scale(1.1);
        }
        
        .cluster-small {
          width: 40px;
          height: 40px;
          font-size: 14px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
        }
        
        .cluster-medium {
          width: 50px;
          height: 50px;
          font-size: 16px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        }
        
        .cluster-large {
          width: 60px;
          height: 60px;
          font-size: 18px;
          background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)));
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .leaflet-popup-close-button {
          color: hsl(var(--foreground)) !important;
          font-size: 24px !important;
          padding: 4px 8px !important;
        }
      `}</style>
    </section>
  );
};

export default DemoJobMap;
