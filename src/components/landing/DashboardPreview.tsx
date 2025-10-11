import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, TrendingUp, Users } from "lucide-react";

const DashboardPreview = () => {
  const stats = [
    { label: "Actieve vacatures", value: "127", trend: "+12%", icon: MapPin, color: "text-blue-500" },
    { label: "Bedrijven", value: "48", trend: "+8%", icon: Building2, color: "text-purple-500" },
    { label: "Recruiters", value: "23", trend: "+3", icon: Users, color: "text-green-500" },
    { label: "Plaatsingen", value: "156", trend: "+24%", icon: TrendingUp, color: "text-orange-500" }
  ];

  const recentActivity = [
    { type: "Vacature toegevoegd", company: "TechCorp Amsterdam", time: "2 min geleden", status: "open" },
    { type: "Kandidaat geplaatst", company: "InnovatieHub Rotterdam", time: "15 min geleden", status: "success" },
    { type: "Vacature vervuld", company: "Digital Solutions Utrecht", time: "1 uur geleden", status: "success" },
    { type: "Nieuw bedrijf", company: "StartUp Den Haag", time: "2 uur geleden", status: "info" }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="p-4 glass-card hover-lift"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <Badge variant="secondary" className="text-xs">
                {stat.trend}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="p-6 glass-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Recente activiteit
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={`h-2 w-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'open' ? 'bg-blue-500' :
                'bg-purple-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{activity.type}</div>
                <div className="text-xs text-muted-foreground truncate">{activity.company}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPreview;
