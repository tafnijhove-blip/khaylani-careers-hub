import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { MapPin, Filter } from "lucide-react";

interface JobMapFiltersProps {
  regions: string[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  minVacancies: number;
  onMinVacanciesChange: (value: number) => void;
  onUseLocation: () => void;
}

const JobMapFilters = ({
  regions,
  selectedRegion,
  onRegionChange,
  minVacancies,
  onMinVacanciesChange,
  onUseLocation
}: JobMapFiltersProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Region Filter */}
        <div className="space-y-2">
          <Label htmlFor="region-filter" className="text-sm font-medium">
            Regio
          </Label>
          <Select value={selectedRegion} onValueChange={onRegionChange}>
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

        {/* Minimum Vacancies Filter */}
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
            onValueChange={(values) => onMinVacanciesChange(values[0])}
            className="w-full"
          />
        </div>

        {/* Use Location Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onUseLocation}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Gebruik mijn locatie
        </Button>
      </div>
    </Card>
  );
};

export default JobMapFilters;
