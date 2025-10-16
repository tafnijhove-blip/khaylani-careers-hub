import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Briefcase, Building2 } from "lucide-react";

interface RegionalStat {
  region: string;
  count: number;
}

interface JobMapStatsProps {
  regionalStats: RegionalStat[];
  totalVacancies: number;
  totalCompanies: number;
  onRegionClick?: (region: string) => void;
}

const JobMapStats = ({ regionalStats, totalVacancies, totalCompanies, onRegionClick }: JobMapStatsProps) => {
  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* Total Stats */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Vacatures</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {totalVacancies}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Bedrijven</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {totalCompanies}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Top Regions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Top 5 Regio's</h3>
        </div>
        <div className="space-y-3">
          {regionalStats.map((stat, index) => (
            <div 
              key={stat.region} 
              onClick={() => onRegionClick?.(stat.region)}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </div>
                <span className="font-medium text-sm">{stat.region}</span>
              </div>
              <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                {stat.count}
              </Badge>
            </div>
          ))}
          {regionalStats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Geen data beschikbaar
            </p>
          )}
        </div>
      </Card>

      {/* Growth Indicator */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">Groei deze maand</p>
            <p className="text-2xl font-bold text-green-600">+12%</p>
          </div>
        </div>
        <p className="text-xs text-green-700 mt-2">
          Meer vacatures dan vorige maand
        </p>
      </Card>
    </div>
  );
};

export default JobMapStats;
