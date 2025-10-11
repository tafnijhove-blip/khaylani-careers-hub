import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

const MapPreview = () => {
  const locations = [
    { name: "Amsterdam", left: "52%", top: "48%", count: 34, color: "bg-blue-500" },
    { name: "Rotterdam", left: "48%", top: "68%", count: 28, color: "bg-purple-500" },
    { name: "Utrecht", left: "54%", top: "55%", count: 21, color: "bg-green-500" },
    { name: "Den Haag", left: "46%", top: "62%", count: 18, color: "bg-orange-500" },
    { name: "Eindhoven", left: "56%", top: "75%", count: 15, color: "bg-pink-500" },
    { name: "Groningen", left: "60%", top: "15%", count: 11, color: "bg-cyan-500" }
  ];

  return (
    <Card className="relative h-[500px] glass-card overflow-hidden group">
      {/* Netherlands map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/30 to-accent/5" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(to right, hsl(var(--muted)) 1px, transparent 1px),
                         linear-gradient(to bottom, hsl(var(--muted)) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.3
      }} />

      {/* Map title */}
      <div className="absolute top-6 left-6 z-10">
        <Badge variant="secondary" className="text-sm">
          <MapPin className="h-4 w-4 mr-2" />
          Geografisch overzicht
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-4 border">
        <div className="text-xs font-semibold mb-2">Legenda</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-gradient-primary animate-pulse" />
          <span>Actieve vacatures per stad</span>
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
            {/* Pulse effect */}
            <div className={`absolute inset-0 ${location.color} rounded-full opacity-30 animate-ping`} 
                 style={{ animationDuration: '2s' }} />
            
            {/* Main marker */}
            <div className={`relative ${location.color} h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-125 transition-transform`}>
              {location.count}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-background border shadow-xl rounded-lg px-3 py-2 whitespace-nowrap">
                <div className="text-xs font-semibold">{location.name}</div>
                <div className="text-xs text-muted-foreground">{location.count} vacatures</div>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-background" />
            </div>
          </div>
        </div>
      ))}

      {/* Info overlay */}
      <div className="absolute top-6 right-6 bg-background/95 backdrop-blur-sm rounded-lg p-4 border max-w-[200px]">
        <div className="text-xs font-semibold mb-2">Totaal overzicht</div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Bedrijven:</span>
            <span className="font-semibold">127</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Vacatures:</span>
            <span className="font-semibold text-primary">127</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Regio's:</span>
            <span className="font-semibold">6</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MapPreview;
