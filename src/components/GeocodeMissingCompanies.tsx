import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GeocodeMissingCompanies = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGeocode = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('geocode-existing-companies');
      
      if (error) throw error;
      
      setResults(data);
      toast({
        title: "Geocoding voltooid",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Fout bij geocoding",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Geocoding Tool
        </CardTitle>
        <CardDescription>
          Voeg automatisch coördinaten toe aan alle bedrijven zonder locatie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGeocode} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Geocoding
        </Button>

        {results && (
          <div className="space-y-3 mt-4">
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500">
                {results.successCount} Succesvol
              </Badge>
              <Badge variant="destructive">
                {results.failCount} Mislukt
              </Badge>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.results?.map((result: any) => (
                <div 
                  key={result.id} 
                  className={`p-2 rounded border text-sm ${
                    result.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
                >
                  <div className="font-medium">{result.naam}</div>
                  {result.success ? (
                    <div className="text-xs text-muted-foreground">
                      Lat: {result.lat?.toFixed(4)}, Lng: {result.lng?.toFixed(4)}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {result.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeocodeMissingCompanies;
