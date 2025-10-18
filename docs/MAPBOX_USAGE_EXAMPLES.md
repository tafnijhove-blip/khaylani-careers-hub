# Mapbox Integratie - Praktische Voorbeelden

## Quick Start

### 1. Basis Kaart Setup

```tsx
import MapDashboardView from "@/components/map/MapDashboardView";

function MyDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bedrijven Kaart</h1>
      <MapDashboardView />
    </div>
  );
}

export default MyDashboard;
```

### 2. Custom Kaart met Eigen Filters

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap from "@/components/map/MapboxDashboardMap";

function CustomMapView() {
  const [companies, setCompanies] = useState([]);
  const [region, setRegion] = useState("all");

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase
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
    
    setCompanies(data || []);
  }

  return (
    <div className="space-y-4">
      <select 
        value={region} 
        onChange={(e) => setRegion(e.target.value)}
        className="p-2 border rounded"
      >
        <option value="all">Alle Regio's</option>
        <option value="Noord-Holland">Noord-Holland</option>
        <option value="Zuid-Holland">Zuid-Holland</option>
      </select>

      <MapboxDashboardMap 
        companies={companies}
        selectedRegion={region}
        minVacancies={0}
      />
    </div>
  );
}
```

## Bedrijf Toevoegen

### Via Form Component

```tsx
import MapCompanyForm from "@/components/map/MapCompanyForm";
import { toast } from "@/hooks/use-toast";

function AddCompanyPage() {
  const handleCompanyAdded = (newCompany) => {
    console.log("Nieuw bedrijf toegevoegd:", newCompany);
    toast({
      title: "Success!",
      description: `${newCompany.naam} is toegevoegd aan de kaart`
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nieuw Bedrijf</h1>
      <MapCompanyForm onCompanyAdded={handleCompanyAdded} />
    </div>
  );
}
```

### Programmatisch Toevoegen

```typescript
import { supabase } from "@/integrations/supabase/client";

async function addCompanyProgrammatically() {
  // Stap 1: Check coordinate cache
  const address = "Hoofdstraat 123";
  const city = "Amsterdam";

  const { data: cachedCompany } = await supabase
    .from("bedrijven")
    .select("lat, lng")
    .ilike("adres", `%${address}%`)
    .ilike("plaats", `%${city}%`)
    .not("lat", "is", null)
    .limit(1)
    .single();

  let coordinates;

  if (cachedCompany?.lat && cachedCompany?.lng) {
    // Gebruik cached coördinaten
    coordinates = { 
      lat: cachedCompany.lat, 
      lng: cachedCompany.lng 
    };
    console.log("Using cached coordinates");
  } else {
    // Stap 2: Geocode via edge function
    const { data: geocodeData, error } = await supabase.functions.invoke(
      'geocode-address',
      { body: { address: `${address}, ${city}, Nederland` } }
    );

    if (error) {
      throw new Error("Geocoding failed: " + error.message);
    }

    coordinates = { 
      lat: geocodeData.lat, 
      lng: geocodeData.lng 
    };
    console.log("Geocoded new address");
  }

  // Stap 3: Insert bedrijf
  const { data: newCompany, error: insertError } = await supabase
    .from("bedrijven")
    .insert({
      naam: "Nieuw Bedrijf BV",
      adres: address,
      plaats: city,
      regio: "Noord-Holland",
      type: "klant",
      lat: coordinates.lat,
      lng: coordinates.lng
    })
    .select()
    .single();

  if (insertError) {
    throw new Error("Failed to insert: " + insertError.message);
  }

  return newCompany;
}

// Gebruik:
try {
  const company = await addCompanyProgrammatically();
  console.log("Added:", company);
} catch (error) {
  console.error("Error:", error);
}
```

## Realtime Updates

### Auto-Refresh Kaart bij Database Changes

```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap from "@/components/map/MapboxDashboardMap";

function RealtimeMapView() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    // Initial load
    fetchCompanies();

    // Subscribe to changes
    const channel = supabase
      .channel('bedrijven-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bedrijven'
        },
        (payload) => {
          console.log('Company changed:', payload);
          fetchCompanies(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase
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

    setCompanies(data || []);
  }

  return <MapboxDashboardMap companies={companies} />;
}
```

## Role-Based Filtering

### SuperAdmin View - Alle Bureaus

```tsx
function SuperAdminMapView() {
  const [companies, setCompanies] = useState([]);
  const [selectedBureau, setSelectedBureau] = useState<string | null>(null);

  useEffect(() => {
    fetchAllCompanies();
  }, [selectedBureau]);

  async function fetchAllCompanies() {
    let query = supabase
      .from("bedrijven")
      .select(`
        *,
        vacatures (*)
      `)
      .not("lat", "is", null);

    if (selectedBureau) {
      // Filter op specifiek bureau
      query = query.eq("type", "detacheringbureau")
        .eq("id", selectedBureau);
    }

    const { data } = await query;
    setCompanies(data || []);
  }

  return (
    <div>
      <select onChange={(e) => setSelectedBureau(e.target.value)}>
        <option value="">Alle Bureaus</option>
        {/* Populate with bureau options */}
      </select>
      <MapboxDashboardMap companies={companies} />
    </div>
  );
}
```

### Account Manager View - Eigen Klanten

```tsx
function AccountManagerMapView() {
  const [myCompanies, setMyCompanies] = useState([]);

  useEffect(() => {
    fetchMyCompanies();
  }, []);

  async function fetchMyCompanies() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Haal alleen eigen klanten op
    const { data } = await supabase
      .from("bedrijven")
      .select(`
        *,
        vacatures (*)
      `)
      .eq("created_by", user.id)
      .eq("type", "klant")
      .not("lat", "is", null);

    setMyCompanies(data || []);
  }

  return (
    <div>
      <h2>Mijn Klanten ({myCompanies.length})</h2>
      <MapboxDashboardMap companies={myCompanies} />
    </div>
  );
}
```

### Recruiter View - Bureau Vacatures

```tsx
function RecruiterMapView() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchBureauCompanies();
  }, []);

  async function fetchBureauCompanies() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get user's company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    // Get all customers linked to this bureau
    const { data: relations } = await supabase
      .from("bedrijf_relaties")
      .select("klant_id")
      .eq("detacheringbureau_id", profile.company_id);

    const customerIds = relations?.map(r => r.klant_id) || [];

    // Get companies with vacancies
    const { data } = await supabase
      .from("bedrijven")
      .select(`
        *,
        vacatures (*)
      `)
      .in("id", customerIds)
      .not("lat", "is", null);

    setCompanies(data || []);
  }

  return <MapboxDashboardMap companies={companies} />;
}
```

## Batch Geocoding - Bestaande Adressen

### Script om alle bedrijven zonder coördinaten te geocoden

```typescript
async function batchGeocodeCompanies() {
  // Get companies without coordinates
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id, naam, adres, plaats")
    .is("lat", null)
    .is("lng", null)
    .not("adres", "is", null)
    .not("plaats", "is", null);

  if (!companies || companies.length === 0) {
    console.log("No companies to geocode");
    return;
  }

  console.log(`Geocoding ${companies.length} companies...`);

  for (const company of companies) {
    try {
      const address = `${company.adres}, ${company.plaats}, Nederland`;
      
      // Geocode
      const { data, error } = await supabase.functions.invoke(
        'geocode-address',
        { body: { address } }
      );

      if (error) {
        console.error(`Failed to geocode ${company.naam}:`, error);
        continue;
      }

      // Update company
      await supabase
        .from("bedrijven")
        .update({
          lat: data.lat,
          lng: data.lng
        })
        .eq("id", company.id);

      console.log(`✓ Geocoded ${company.naam}`);

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error processing ${company.naam}:`, error);
    }
  }

  console.log("Batch geocoding complete!");
}

// Run it:
batchGeocodeCompanies();
```

## Custom Marker Styling

### Verschillende kleuren per vacature status

```tsx
// In MapboxDashboardMap.tsx - customize marker creation

const createMarker = (company) => {
  const openCount = company.vacatures?.filter(v => v.status === 'open').length || 0;
  
  // Bepaal kleur op basis van aantal vacatures
  let backgroundColor;
  if (openCount === 0) {
    backgroundColor = "#94a3b8"; // Grijs - geen vacatures
  } else if (openCount < 3) {
    backgroundColor = "#10b981"; // Groen - weinig vacatures
  } else if (openCount < 6) {
    backgroundColor = "#f59e0b"; // Oranje - gemiddeld
  } else {
    backgroundColor = "#ef4444"; // Rood - veel vacatures
  }

  const el = document.createElement("div");
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = backgroundColor;
  el.style.border = "3px solid white";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "white";
  el.style.fontWeight = "bold";
  el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  el.textContent = openCount.toString();

  return el;
};
```

## Testing

### Unit Test voor Geocoding Caching

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Geocoding Cache', () => {
  it('should use cached coordinates when available', async () => {
    // Mock supabase response with cached data
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { lat: 52.3676, lng: 4.9041 }
                  })
                })
              })
            })
          })
        })
      }),
      functions: {
        invoke: vi.fn() // Should NOT be called
      }
    };

    // Your cache check logic here
    const result = await checkCoordinateCache(
      mockSupabase,
      "Hoofdstraat 123",
      "Amsterdam"
    );

    expect(result).toEqual({ lat: 52.3676, lng: 4.9041 });
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
  });
});
```

## Debugging

### Log alle markers

```tsx
useEffect(() => {
  console.log("Companies to map:", companies.length);
  
  companies.forEach(company => {
    const coords = getCompanyLngLat(company);
    console.log(company.naam, coords ? "✓ has coords" : "✗ no coords");
  });
}, [companies]);
```

### Check RLS Policies

```sql
-- Test of user bedrijven kan zien
SELECT * FROM bedrijven WHERE lat IS NOT NULL LIMIT 5;

-- Test of geocoding werkt
SELECT lat, lng, naam FROM bedrijven WHERE lat IS NOT NULL;
```

## Performance Tips

1. **Lazy Loading:** Laad alleen bedrijven in zichtbaar gebied
2. **Clustering:** Bij 50+ markers, gebruik clustering
3. **Debounce Filters:** Wacht 300ms voor re-render bij filter changes
4. **Memoization:** Cache gefilterde companies

```tsx
import { useMemo } from 'react';

const filteredCompanies = useMemo(() => {
  return companies.filter(c => {
    const regionMatch = selectedRegion === 'all' || c.regio === selectedRegion;
    const vacancyMatch = c.vacatures?.length >= minVacancies;
    return regionMatch && vacancyMatch;
  });
}, [companies, selectedRegion, minVacancies]);
```

## Complete Production Example

```tsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap from "@/components/map/MapboxDashboardMap";
import MapCompanyForm from "@/components/map/MapCompanyForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function ProductionMapDashboard() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("all");
  const [minVacancies, setMinVacancies] = useState(0);

  useEffect(() => {
    fetchCompanies();
    
    // Realtime subscription
    const channel = supabase
      .channel('map-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bedrijven'
      }, () => fetchCompanies())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bedrijven")
      .select(`*, vacatures(*)`)
      .not("lat", "is", null);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const regionMatch = region === "all" || c.regio === region;
      const vacancyCount = c.vacatures?.filter(v => v.status === 'open').length || 0;
      return regionMatch && vacancyCount >= minVacancies;
    });
  }, [companies, region, minVacancies]);

  const regions = useMemo(() => 
    Array.from(new Set(companies.map(c => c.regio))).sort(),
    [companies]
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid lg:grid-cols-4 gap-6 p-6">
      <div className="space-y-6">
        <Card className="p-4">
          <Label>Regio Filter</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {regions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
        
        <MapCompanyForm 
          onCompanyAdded={(company) => {
            setCompanies(prev => [...prev, company]);
            toast({ title: "Toegevoegd!", description: company.naam });
          }} 
        />
      </div>

      <div className="lg:col-span-3">
        <MapboxDashboardMap 
          companies={filteredCompanies}
          selectedRegion={region}
          minVacancies={minVacancies}
        />
      </div>
    </div>
  );
}

export default ProductionMapDashboard;
```
