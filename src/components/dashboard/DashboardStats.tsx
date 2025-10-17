import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, MapPin, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface RegionalStat {
  region: string;
  count: number;
}

interface DashboardStatsProps {
  totalCompanies: number;
  openVacancies: number;
  filledVacancies: number;
  totalPositions: number;
  regionalStats?: RegionalStat[];
  teamMembers?: number;
  showRegionalStats?: boolean;
  onRegionClick?: (region: string) => void;
}

const DashboardStats = ({
  totalCompanies,
  openVacancies,
  filledVacancies,
  totalPositions,
  regionalStats = [],
  teamMembers,
  showRegionalStats = true,
  onRegionClick
}: DashboardStatsProps) => {
  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <Card className="border-primary/20 hover:border-primary/40 hover:shadow-glow transition-all duration-500 glow-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klanten</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gradient">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Actieve klanten</p>
          </CardContent>
        </Card>

        <Card className="border-accent-cyan/20 hover:border-accent-cyan/40 hover:shadow-glow-cyan transition-all duration-500 glow-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Vacatures</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-cyan to-accent-teal flex items-center justify-center shadow-glow-cyan group-hover:scale-110 transition-transform">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-cyan to-accent-teal bg-clip-text text-transparent">
              {openVacancies}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Openstaande kansen</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 hover:border-green-500/40 hover:shadow-glow transition-all duration-500 glow-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingevuld</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              {filledVacancies}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vervulde vacatures</p>
          </CardContent>
        </Card>

        <Card className="border-accent-purple/20 hover:border-accent-purple/40 hover:shadow-glow transition-all duration-500 glow-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Posities</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-purple to-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-purple to-primary bg-clip-text text-transparent">
              {totalPositions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Te vervullen</p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Stats & Growth */}
      {showRegionalStats && regionalStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Regions */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Top 5 Regio's
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Regio's met de meeste openstaande vacatures</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {regionalStats.slice(0, 5).map((stat, index) => (
                  <div
                    key={stat.region}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      onRegionClick ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/50' : ''
                    }`}
                    onClick={() => onRegionClick?.(stat.region)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{stat.region}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {stat.count} {stat.count === 1 ? 'vacature' : 'vacatures'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Growth Indicator */}
          <Card className="border-green-500/20 hover:border-green-500/40 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Groei Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Maandelijkse groei</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">+18%</div>
                  <p className="text-xs text-muted-foreground mt-1">Nieuwe vacatures deze maand</p>
                </div>
                
                {teamMembers !== undefined && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-primary/5 dark:from-purple-950/20 dark:to-primary/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-accent-purple" />
                      <span className="text-sm font-medium">Actieve teamleden</span>
                    </div>
                    <div className="text-3xl font-bold text-accent-purple">{teamMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Recruiters en accountmanagers</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
