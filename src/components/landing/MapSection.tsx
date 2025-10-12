import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Target, Building2, Briefcase, Filter, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  bedrijf_id: string;
}

interface CompanyWithVacancies extends Bedrijf {
  openVacancies: number;
  topJobs: string[];
}

interface RegionStats {
  regio: string;
  count: number;
  growth: number;
}

const MapSection = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  // Data state
  const [companies, setCompanies] = useState<CompanyWithVacancies[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [selectedRegio, setSelectedRegio] = useState<string>("all");
  const [selectedMinVacancies, setSelectedMinVacancies] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [travelRadius, setTravelRadius] = useState<number | null>(null);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch bedrijven with coordinates
        const { data: bedrijvenData, error: bedrijvenError } = await supabase
          .from('bedrijven')
          .select('*')
          .not('lat', 'is', null)
          .not('lng', 'is', null);

        if (bedrijvenError) throw bedrijvenError;

        // Fetch open vacatures
        const { data: vacaturesData, error: vacaturesError } = await supabase
          .from('vacatures')
          .select('id, functietitel, status, bedrijf_id')
          .eq('status', 'open');

        if (vacaturesError) throw vacaturesError;

        // Combine data
        const companiesWithVacancies: CompanyWithVacancies[] = (bedrijvenData || []).map(bedrijf => {
          const companyVacatures = (vacaturesData || []).filter(v => v.bedrijf_id === bedrijf.id);
          const topJobs = companyVacatures.slice(0, 3).map(v => v.functietitel);
          
          return {
            ...bedrijf,
            openVacancies: companyVacatures.length,
            topJobs
          };
        }).filter(c => c.openVacancies > 0); // Only show companies with open vacancies

        setCompanies(companiesWithVacancies);

        // Calculate region stats
        const regionMap = new Map<string, number>();
        companiesWithVacancies.forEach(c => {
          regionMap.set(c.regio, (regionMap.get(c.regio) || 0) + c.openVacancies);
        });

        const stats: RegionStats[] = Array.from(regionMap.entries())
          .map(([regio, count]) => ({
            regio,
            count,
            growth: Math.floor(Math.random() * 30) - 10 // Mock growth data
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setRegionStats(stats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (selectedRegio !== "all" && c.regio !== selectedRegio) return false;
      if (selectedMinVacancies !== "all") {
        const min = parseInt(selectedMinVacancies);
        if (c.openVacancies < min) return false;
      }
      return true;
    });
  }, [companies, selectedRegio, selectedMinVacancies]);

  // Get unique regions for filter
  const regions = useMemo(() => {
    return Array.from(new Set(companies.map(c => c.regio))).sort();
  }, [companies]);

  // Get pin color based on vacancy count
  const getPinColor = (count: number): string => {
    if (count >= 6) return '#0B3D91'; // Dark blue
    if (count >= 3) return '#0077FF'; // Medium blue
    return '#5BA3FF'; // Light blue
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [5.2913, 52.1326],
        zoom: 6.5,
      });

      const currentMap = map.current;

      currentMap.on('load', () => {
        setMapLoaded(true);
        currentMap.scrollZoom.enable();
        currentMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      });

      return () => {
        currentMap.remove();
      };
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded || filteredCompanies.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    filteredCompanies.forEach((company) => {
      if (!company.lat || !company.lng) return;

      const color = getPinColor(company.openVacancies);
      
      // Create pin element - simplified for performance
      const el = document.createElement('div');
      el.className = 'company-pin';
      el.style.cssText = `
        background: ${color};
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 119, 255, 0.2);
        border: 1px solid rgba(255,255,255,0.3);
        transition: transform 0.2s ease;
        white-space: nowrap;
      `;
      
      el.textContent = company.naam.length > 12 ? company.naam.substring(0, 12) + '…' : company.naam;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'translateY(-2px) scale(1.05)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translateY(0) scale(1)';
      });

      // Create popup - only when clicked for performance
      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: true,
        maxWidth: '280px'
      }).setHTML(`
        <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; gap: 10px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">
              ${company.openVacancies}
            </div>
            <div>
              <h3 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #1a1a1a;">
                ${company.naam}
              </h3>
              <p style="color: #666; font-size: 12px; margin: 0;">
                ${company.plaats || company.regio}
              </p>
            </div>
          </div>
          ${company.topJobs.length > 0 ? `
            <div style="border-top: 1px solid #e5e5e5; padding-top: 10px; margin-bottom: 10px;">
              <p style="font-size: 11px; font-weight: 600; color: #666; margin: 0 0 6px 0; text-transform: uppercase;">
                Vacatures
              </p>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px;">
                ${company.topJobs.map(job => `
                  <li style="font-size: 12px; color: #333;">• ${job}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          <a href="/auth" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            text-decoration: none;
          ">
            Bekijk alle vacatures →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker(el)
        .setLngLat([company.lng, company.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [mapLoaded, filteredCompanies]);

  const totalVacancies = useMemo(() => 
    filteredCompanies.reduce((sum, c) => sum + c.openVacancies, 0),
    [filteredCompanies]
  );

  const aiInsight = useMemo(() => {
    if (regionStats.length === 0) return "";
    const topRegion = regionStats[0];
    const secondRegion = regionStats[1];
    return `De meeste openstaande vacatures bevinden zich in ${topRegion.regio} (${topRegion.count} vacatures) en ${secondRegion?.regio || 'andere regio\'s'} (${secondRegion?.count || 0} vacatures), met ${topRegion.growth > 0 ? 'groeiende' : 'stabiele'} vraag.`;
  }, [regionStats]);

  return (
    <div className="space-y-8">
      {/* CTA Banner */}
      <Card className="glass-card p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <h2 className="text-3xl font-bold mb-3">
          Ontdek waar jouw klanten de meeste vacatures hebben
        </h2>
        <p className="text-muted-foreground text-lg mb-6">
          Geografisch inzicht in recruitment activiteit en jobdensiteit per regio
        </p>
        <Button size="lg" className="gap-2">
          Verken mijn regio
          <Target className="h-5 w-5" />
        </Button>
      </Card>

      {/* Main Map Container */}
      <div className="relative">
        <Card className="relative h-[700px] glass-card overflow-hidden border">
          {/* Map */}
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Filter Panel */}
          <div className="absolute top-6 left-6 z-10 glass-card rounded-xl p-5 border shadow-xl max-w-[280px] backdrop-blur-lg bg-background/95">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Filters</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">REGIO</Label>
                <Select value={selectedRegio} onValueChange={setSelectedRegio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle regio's" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle regio's</SelectItem>
                    {regions.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">MIN. VACATURES</Label>
                <Select value={selectedMinVacancies} onValueChange={setSelectedMinVacancies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle aantallen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle aantallen</SelectItem>
                    <SelectItem value="1">1+ vacatures</SelectItem>
                    <SelectItem value="3">3+ vacatures</SelectItem>
                    <SelectItem value="6">6+ vacatures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-semibold mb-2">Reisafstand (optioneel)</div>
                <div className="flex gap-2">
                  {[10, 20, 30].map(radius => (
                    <Button
                      key={radius}
                      variant={travelRadius === radius ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTravelRadius(travelRadius === radius ? null : radius)}
                      className="flex-1 text-xs"
                    >
                      {radius}km
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overlay */}
          <div className="absolute top-6 right-6 bg-background/95 backdrop-blur-md rounded-xl p-5 border shadow-xl max-w-[240px] z-10">
            <div className="text-sm font-bold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Overzicht
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bedrijven:</span>
                <span className="font-bold">{filteredCompanies.length}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vacatures:</span>
                <span className="font-bold text-primary">{totalVacancies}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Regio's:</span>
                <span className="font-bold">{regions.length}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-10 bg-background/95 backdrop-blur-md rounded-xl p-4 border shadow-xl max-w-[260px]">
            <div className="text-xs font-semibold mb-3">VACATURE INTENSITEIT</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="h-4 w-4 rounded-full" style={{ background: '#5BA3FF' }} />
                <span className="text-muted-foreground">1-2 vacatures (Laag)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="h-4 w-4 rounded-full" style={{ background: '#0077FF' }} />
                <span className="text-muted-foreground">3-5 vacatures (Gemiddeld)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="h-4 w-4 rounded-full" style={{ background: '#0B3D91' }} />
                <span className="text-muted-foreground">6+ vacatures (Hoog)</span>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {(!mapLoaded || isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Data laden...' : 'Kaart laden...'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Stats Sidebar */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card p-6 border">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Top 5 Regio's met Meeste Vacatures</h3>
          </div>
          <div className="space-y-3">
            {regionStats.map((stat, idx) => (
              <div key={stat.regio} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{stat.regio}</div>
                    <div className="text-xs text-muted-foreground">{stat.count} vacatures</div>
                  </div>
                </div>
                <Badge variant={stat.growth > 0 ? "default" : "secondary"}>
                  {stat.growth > 0 ? '+' : ''}{stat.growth}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Insight Box */}
        <Card className="glass-card p-6 border bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-lg">AI Inzichten</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {aiInsight || "Nog geen data beschikbaar voor AI-analyse."}
          </p>
          <div className="p-4 rounded-lg bg-background/60 border">
            <p className="text-sm text-muted-foreground italic">
              💡 <strong>Tip:</strong> Regio's met groeiende vraag zijn ideaal voor strategische recruiter-inzet.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Label component for form fields
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export default MapSection;
