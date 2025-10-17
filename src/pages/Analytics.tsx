import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Briefcase, Building2, MapPin, Clock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalVacatures: 0,
    openVacatures: 0,
    totalBedrijven: 0,
    totalPosities: 0,
    positiesVervuld: 0,
    positiesOpen: 0,
  });
  const [regioData, setRegioData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [prioriteitData, setPrioriteitData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [bedrijvenRes, vacaturesRes, vacatureStatsRes] = await Promise.all([
        supabase.from("bedrijven").select("*"),
        supabase.from("vacatures").select("*"),
        supabase.from("vacature_stats").select("*"),
      ]);

      const bedrijven = bedrijvenRes.data || [];
      const vacatures = vacaturesRes.data || [];
      const vacatureStats = vacatureStatsRes.data || [];

      const totalPosities = vacatures.reduce((sum, v) => sum + v.aantal_posities, 0);
      const positiesVervuld = vacatureStats.reduce((sum, vs) => sum + (vs.posities_vervuld || 0), 0);

      // Calculate stats
      setStats({
        totalVacatures: vacatures.length,
        openVacatures: vacatures.filter((v) => v.status === "open").length,
        totalBedrijven: bedrijven.length,
        totalPosities,
        positiesVervuld,
        positiesOpen: totalPosities - positiesVervuld,
      });

      // Regio distribution
      const regioCount: Record<string, number> = {};
      bedrijven.forEach((b) => {
        regioCount[b.regio] = (regioCount[b.regio] || 0) + 1;
      });
      setRegioData(
        Object.entries(regioCount)
          .map(([naam, waarde]) => ({ naam, waarde }))
          .sort((a, b) => b.waarde - a.waarde)
          .slice(0, 8)
      );

      // Status distribution
      const statusCount: Record<string, number> = {};
      vacatures.forEach((v) => {
        statusCount[v.status] = (statusCount[v.status] || 0) + 1;
      });
      setStatusData(Object.entries(statusCount).map(([naam, waarde]) => ({ naam, waarde })));

      // Priority distribution
      const prioriteitCount: Record<string, number> = {};
      vacatures.forEach((v) => {
        prioriteitCount[v.prioriteit] = (prioriteitCount[v.prioriteit] || 0) + 1;
      });
      setPrioriteitData(Object.entries(prioriteitCount).map(([naam, waarde]) => ({ naam, waarde })));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = {
    open: "#22c55e",
    invulling: "#eab308",
    on_hold: "#f97316",
    gesloten: "#6b7280",
  };

  const PRIORITY_COLORS = {
    laag: "#6b7280",
    normaal: "#3b82f6",
    hoog: "#f97316",
    urgent: "#ef4444",
  };

  const chartColors = useMemo(() => ({
    primary: "hsl(var(--primary))",
    accent: "hsl(var(--accent))",
    muted: "hsl(var(--muted))",
    border: "hsl(var(--border))",
    card: "hsl(var(--card))",
  }), []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Analytics laden..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Analytics Header */}
        <header>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Uitgebreide statistieken en inzichten in vacatures en bedrijven</p>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vacatures</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalVacatures}</div>
              <p className="text-xs text-muted-foreground mt-1">Alle vacatures in systeem</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Vacatures</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.openVacatures}</div>
              <p className="text-xs text-muted-foreground mt-1">Actief openstaande posities</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Bedrijven</CardTitle>
              <Building2 className="h-5 w-5 text-accent-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalBedrijven}</div>
              <p className="text-xs text-muted-foreground mt-1">Klanten in portfolio</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Posities</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalPosities}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.positiesVervuld} vervuld • {stats.positiesOpen} open
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Bedrijven per Regio
              </CardTitle>
              <CardDescription>Geografische verdeling van klanten</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regioData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="naam" className="text-xs" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="waarde" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent" />
                Vacature Status Verdeling
              </CardTitle>
              <CardDescription>Overzicht van alle vacature statussen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ naam, waarde }) => `${naam}: ${waarde}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="waarde"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.naam as keyof typeof STATUS_COLORS] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Prioriteit Verdeling
            </CardTitle>
            <CardDescription>Urgentie van openstaande vacatures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prioriteitData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="naam" type="category" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="waarde" radius={[0, 8, 8, 0]}>
                  {prioriteitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.naam as keyof typeof PRIORITY_COLORS] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
