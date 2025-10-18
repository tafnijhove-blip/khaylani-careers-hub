import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap, { type Company } from "./MapboxDashboardMap";
import MapCompanyForm from "./MapCompanyForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const MapDashboardView = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [minVacancies, setMinVacancies] = useState(0);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // Fetch companies with their vacancies
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
        .not("lng", "is", null);

      if (error) throw error;

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
