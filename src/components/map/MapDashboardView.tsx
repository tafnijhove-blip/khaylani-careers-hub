import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap, { type Company } from "./MapboxDashboardMap";
import MapCompanyForm from "./MapCompanyForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Filter, Info } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MapDashboardView = () => {
  const { data: userRole } = useUserRole();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [minVacancies, setMinVacancies] = useState(0);

  // Role-based access info
  const getRoleInfo = () => {
    switch (userRole) {
      case 'superadmin':
        return 'Je ziet alle bedrijven van alle bureaus';
      case 'ceo':
        return 'Je ziet alle bedrijven van je bureau';
      case 'accountmanager':
        return 'Je ziet alleen jouw klanten';
      case 'recruiter':
        return 'Je ziet alle bedrijven van je bureau';
      default:
        return 'Je ziet bedrijven waar je toegang tot hebt';
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // RLS policies automatically filter based on user role
      // SuperAdmin: sees all companies
      // CEO/Manager: sees own company + linked customers
      // AccountManager: sees linked customers they manage
      // Recruiter: sees companies with vacancies they can access
      
      const { data, error } = await supabase
        .from("bedrijven")
        .select(`
          *,
          vacatures (
            id,
            functietitel,
            status,
            aantal_posities
          )
        `)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order('naam');

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} companies for role: ${userRole}`);
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanyAdded = (newCompany: Company) => {
    setCompanies(prev => [...prev, newCompany]);
    fetchCompanies(); // Refresh to ensure data is up to date
  };

  const regions = Array.from(new Set(companies.map(c => c.regio).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {getRoleInfo()}
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters and Form Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Filters</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region-filter" className="text-sm font-medium">
                  Regio
                </Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger id="region-filter">
                    <SelectValue placeholder="Selecteer regio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle regio's</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-vacancies" className="text-sm font-medium">
                  Min. vacatures: {minVacancies}
                </Label>
                <Slider
                  id="min-vacancies"
                  min={0}
                  max={10}
                  step={1}
                  value={[minVacancies]}
                  onValueChange={(values) => setMinVacancies(values[0])}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Add Company Form */}
          <MapCompanyForm onCompanyAdded={handleCompanyAdded} />
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <MapboxDashboardMap
            companies={companies}
            selectedRegion={selectedRegion}
            minVacancies={minVacancies}
            showHeatmap={false}
            showTooltip={false}
          />
        </div>
      </div>
    </div>
  );
};

export default MapDashboardView;
