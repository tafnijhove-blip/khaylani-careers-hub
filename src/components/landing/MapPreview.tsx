import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

const MapPreview = () => {
  const locations = [
    { name: "Amsterdam", left: "52%", top: "35%", count: 34, color: "bg-blue-500" },
    { name: "Rotterdam", left: "48%", top: "55%", count: 28, color: "bg-purple-500" },
    { name: "Utrecht", left: "54%", top: "45%", count: 21, color: "bg-green-500" },
    { name: "Den Haag", left: "46%", top: "52%", count: 18, color: "bg-orange-500" },
    { name: "Eindhoven", left: "58%", top: "68%", count: 15, color: "bg-pink-500" },
    { name: "Groningen", left: "62%", top: "18%", count: 11, color: "bg-cyan-500" }
  ];

  return (
    <Card className="relative h-[600px] glass-card overflow-hidden group">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Netherlands SVG Map */}
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <svg 
          viewBox="0 0 300 400" 
          className="w-full h-full opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.3))' }}
        >
          {/* Simplified Netherlands shape */}
          <path
            d="M 150 40 
               L 170 45 L 185 50 L 195 60 L 200 75 
               L 205 90 L 208 110 L 210 130 
               L 212 150 L 213 170 L 214 190 
               L 213 210 L 210 230 L 205 250 
               L 198 270 L 188 285 L 175 295 
               L 160 300 L 145 302 L 130 300 
               L 115 295 L 100 285 L 90 270 
               L 83 250 L 78 230 L 75 210 
               L 74 190 L 75 170 L 77 150 
               L 80 130 L 85 110 L 92 90 
               L 100 75 L 110 60 L 125 50 
               L 140 45 Z"
            fill="hsl(var(--primary) / 0.1)"
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        </svg>
      </div>

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px'
      }} />

      {/* Map title */}
      <div className="absolute top-6 left-6 z-10">
        <Badge variant="secondary" className="text-sm shadow-lg">
          <MapPin className="h-4 w-4 mr-2" />
          Nederland - Live Vacature Tracking
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-background/95 backdrop-blur-md rounded-xl p-4 border shadow-xl max-w-[250px]">
        <div className="text-xs font-semibold mb-3">Legenda</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-3 w-3 rounded-full bg-gradient-primary animate-pulse" />
            <span>Actieve vacatures</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Locatie marker</span>
          </div>
        </div>
      </div>

      {/* Location markers */}
      {locations.map((location, index) => (
        <div
          key={index}
          className="absolute z-20 animate-fade-in"
          style={{ 
            left: location.left, 
            top: location.top,
            animationDelay: `${index * 0.15}s`
          }}
        >
          <div className="relative group/marker">
            {/* Pulse rings */}
            <div className={`absolute inset-0 ${location.color} rounded-full opacity-40 animate-ping`} 
                 style={{ animationDuration: '2s', animationDelay: `${index * 0.3}s` }} />
            <div className={`absolute inset-0 ${location.color} rounded-full opacity-20 animate-ping`} 
                 style={{ animationDuration: '3s', animationDelay: `${index * 0.3}s` }} />
            
            {/* Main marker */}
            <div className={`relative ${location.color} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xl cursor-pointer hover:scale-125 transition-all duration-300 border-2 border-white`}>
              {location.count}
            </div>

            {/* Connecting line to center */}
            <div className={`absolute top-1/2 left-1/2 w-px h-4 ${location.color} opacity-30 -translate-x-1/2`} />

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 pointer-events-none scale-95 group-hover/marker:scale-100">
              <div className="bg-background border-2 shadow-2xl rounded-xl px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-bold mb-1">{location.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location.count} openstaande vacatures
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-8 border-transparent border-t-background" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Info overlay */}
      <div className="absolute top-6 right-6 bg-background/95 backdrop-blur-md rounded-xl p-5 border shadow-xl max-w-[220px]">
        <div className="text-sm font-bold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live overzicht
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bedrijven:</span>
            <span className="font-bold">127</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vacatures:</span>
            <span className="font-bold text-primary">127</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Regio's:</span>
            <span className="font-bold">6</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recruiters:</span>
            <span className="font-bold">23</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
    </Card>
  );
};

export default MapPreview;
