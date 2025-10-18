# Mapbox Integratie API Documentatie

## Overzicht

De Khaylani Mapbox-integratie biedt een volledige kaartoplossing met automatische geocoding, coordinate caching en role-based filtering. Alle data wordt opgeslagen in Supabase en de integratie gebruikt Lovable Cloud edge functions voor serverside logica.

## Backend Architecture

### Database Schema

#### Bedrijven Tabel
```sql
CREATE TABLE bedrijven (
  id UUID PRIMARY KEY,
  naam TEXT NOT NULL,
  adres TEXT,
  plaats TEXT,
  regio TEXT NOT NULL,
  type bedrijf_type NOT NULL, -- 'detacheringbureau' of 'klant'
  lat NUMERIC,  -- Cached geocoded latitude
  lng NUMERIC,  -- Cached geocoded longitude
  email TEXT,
  telefoon TEXT,
  contactpersoon TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Vacatures Tabel
```sql
CREATE TABLE vacatures (
  id UUID PRIMARY KEY,
  bedrijf_id UUID REFERENCES bedrijven(id),
  functietitel TEXT NOT NULL,
  status vacature_status NOT NULL, -- 'open', 'vervuld', 'gesloten'
  aantal_posities INTEGER DEFAULT 1,
  prioriteit prioriteit_level,
  created_by UUID REFERENCES auth.users(id),
  datum_toegevoegd TIMESTAMP DEFAULT NOW()
);
```

## Edge Function: geocode-address

### Endpoint
```
POST https://vqrxoyilywtnpmdldpxc.supabase.co/functions/v1/geocode-address
```

### Headers
```json
{
  "Authorization": "Bearer <SUPABASE_ANON_KEY>",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "address": "Hoofdstraat 123, Amsterdam, Nederland"
}
```

### Response (Success)
```json
{
  "lat": 52.3676,
  "lng": 4.9041,
  "place_name": "Hoofdstraat 123, 1011 Amsterdam, Netherlands"
}
```

### Response (Error)
```json
{
  "error": "Geen locatie gevonden voor dit adres. Controleer of het adres correct is."
}
```

### Caching Strategy
1. Controleer eerst of er al een bedrijf bestaat met dezelfde adres + plaats combinatie die coördinaten heeft
2. Gebruik cached coördinaten indien beschikbaar (bespaart API calls)
3. Roep alleen Mapbox Geocoding API aan voor nieuwe adressen
4. Sla nieuwe coördinaten op in de database voor toekomstig hergebruik

## Frontend Components

### MapboxDashboardMap
Hoofdcomponent voor het tonen van de kaart met bedrijfsmarkers.

**Props:**
```typescript
interface MapboxDashboardMapProps {
  companies: Company[];
  selectedRegion?: string;
  minVacancies?: number;
  showHeatmap?: boolean;
  showTooltip?: boolean;
}
```

**Features:**
- Automatische markers voor alle bedrijven met coördinaten
- Popup met bedrijfsnaam en aantal vacatures
- Realtime updates via Supabase subscriptions
- Fly-to functionaliteit bij nieuwe markers
- Responsive design (desktop + mobiel)

### MapCompanyForm
Formulier component voor het toevoegen van nieuwe bedrijven met automatische geocoding.

**Props:**
```typescript
interface MapCompanyFormProps {
  onCompanyAdded: (company: Company) => void;
}
```

**Features:**
- Validatie van minimale vereiste velden (naam, adres, plaats, regio)
- Automatische coördinaten caching check
- Geocoding via edge function indien nodig
- Real-time marker toevoeging aan kaart
- Form reset na succesvol toevoegen
- Error handling met toast notifications

### MapDashboardView
Complete dashboard view die kaart en formulier combineert.

**Features:**
- Geïntegreerde filters (regio, min. vacatures)
- Sidebar met filters en add company form
- Automatische data refresh
- Loading states

## Role-Based Filtering

Filtering gebeurt automatisch via Supabase Row Level Security (RLS) policies:

### SuperAdmin
- **Toegang:** Alle bureaus en alle klanten
- **Query:** Geen filters, ziet alles
- **RLS Policy:** `has_role(auth.uid(), 'superadmin'::app_role)`

### Manager
- **Toegang:** Alle klanten van eigen bureau
- **Query:** Filter op `company_id` van ingelogde user
- **RLS Policy:** `bedrijf_id = get_user_tenant_id(auth.uid())`

### Recruiter
- **Toegang:** Alle vacatures van bureau, filtered via kaart
- **Query:** Vacatures waar `bedrijf_id` matches bureau klanten
- **RLS Policy:** Via `bedrijf_relaties` tabel

### Account Manager
- **Toegang:** Alleen eigen klanten
- **Query:** Filter op `created_by` of via `bedrijf_relaties`
- **RLS Policy:** `created_by = auth.uid()` of via relaties

## Gebruiksvoorbeelden

### 1. Kaart Integreren in Dashboard
```tsx
import MapDashboardView from "@/components/map/MapDashboardView";

function Dashboard() {
  return (
    <DashboardLayout>
      <h1>Mijn Dashboard</h1>
      <MapDashboardView />
    </DashboardLayout>
  );
}
```

### 2. Alleen Kaart Tonen (zonder formulier)
```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxDashboardMap from "@/components/map/MapboxDashboardMap";

function MyMap() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
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
    fetchCompanies();
  }, []);

  return (
    <MapboxDashboardMap 
      companies={companies}
      selectedRegion="all"
      minVacancies={0}
    />
  );
}
```

### 3. Programmatisch Bedrijf Toevoegen
```typescript
async function addCompany(formData: {
  naam: string;
  adres: string;
  plaats: string;
  regio: string;
}) {
  // Check cache
  const { data: existing } = await supabase
    .from("bedrijven")
    .select("lat, lng")
    .ilike("adres", `%${formData.adres}%`)
    .ilike("plaats", `%${formData.plaats}%`)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(1)
    .single();

  let coordinates;

  if (existing?.lat && existing?.lng) {
    // Use cached
    coordinates = { lat: existing.lat, lng: existing.lng };
  } else {
    // Geocode
    const { data } = await supabase.functions.invoke('geocode-address', {
      body: { address: `${formData.adres}, ${formData.plaats}, Nederland` }
    });
    coordinates = { lat: data.lat, lng: data.lng };
  }

  // Insert
  const { data: newCompany } = await supabase
    .from("bedrijven")
    .insert({
      ...formData,
      type: "klant",
      lat: coordinates.lat,
      lng: coordinates.lng
    })
    .select()
    .single();

  return newCompany;
}
```

## Performance Optimalisaties

### 1. Coordinate Caching
- Voorkom onnodige Mapbox API calls
- Hergebruik coördinaten van bestaande adressen
- Bespaart kosten en verbetert snelheid

### 2. Realtime Updates
- Supabase Realtime subscriptions voor live updates
- Automatische marker refresh bij database wijzigingen
- Geen polling nodig

### 3. Efficient Marker Rendering
- Markers worden alleen gerenderd voor bedrijven met coördinaten
- Automatic bounds fitting bij zoom
- Memory cleanup bij component unmount

### 4. Query Optimalisatie
```sql
-- Index voor snellere adres lookups
CREATE INDEX idx_bedrijven_adres_plaats ON bedrijven(adres, plaats);

-- Index voor coordinate filtering
CREATE INDEX idx_bedrijven_coords ON bedrijven(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
```

## Security

### RLS Policies
Alle queries worden automatisch gefilterd op basis van user role:

```sql
-- Example: Users kunnen alleen eigen company data zien
CREATE POLICY "users_view_own_company_bedrijven"
ON bedrijven FOR SELECT
USING (
  bedrijf_id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
);
```

### API Key Management
- Mapbox Public Token is opgeslagen in Supabase secrets
- Alleen edge functions hebben toegang tot de token
- Frontend gebruikt edge function, niet direct Mapbox API

## Testing

### Test met Mock Data
```typescript
const mockCompanies = [
  {
    id: "1",
    naam: "TechCorp Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    regio: "Noord-Holland",
    plaats: "Amsterdam",
    vacatures: [
      { id: "v1", status: "open", functietitel: "Developer", aantal_posities: 2 }
    ]
  },
  // ... meer test data
];
```

### Edge Function Testen
```bash
# Test geocoding
curl -X POST https://vqrxoyilywtnpmdldpxc.supabase.co/functions/v1/geocode-address \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "Dam 1, Amsterdam, Nederland"}'
```

## Troubleshooting

### Kaart laadt niet
1. Controleer of `VITE_MAPBOX_PUBLIC_TOKEN` is ingesteld in `.env`
2. Controleer browser console voor errors
3. Verificeer dat bedrijven lat/lng hebben

### Geen markers zichtbaar
1. Controleer of bedrijven `lat` en `lng` niet `null` zijn
2. Run coordinate update voor bestaande bedrijven zonder coords
3. Controleer RLS policies voor data toegang

### Geocoding faalt
1. Controleer of `MAPBOX_PUBLIC_TOKEN` secret is ingesteld in Supabase
2. Verificeer adres format (moet volledig zijn)
3. Check edge function logs in Supabase

## Kosten Optimalisatie

### Mapbox API Limits
- Free tier: 100.000 requests/maand
- Met caching: gemiddeld 1 request per nieuw adres
- Schatting: ~1000 bedrijven = ~1000 requests (eenmalig)

### Best Practices
1. Gebruik altijd coordinate caching
2. Batch geocode bestaande adressen (één keer)
3. Valideer adressen voor geocoding (voorkom foute requests)

## Uitbreidingsmogelijkheden

### Toekomstige Features
1. **Clustering:** Bij 100+ markers, gebruik Mapbox marker clustering
2. **Heatmap:** Visualiseer vacature-dichtheid per regio
3. **Routes:** Bereken routes tussen bedrijven
4. **Custom Markers:** Upload bedrijfslogo's als custom map markers
5. **Filters:** Uitgebreide filters (sector, aantal vacatures, etc.)

## Support

Voor vragen of issues:
- Check Supabase edge function logs
- Gebruik browser developer tools (console)
- Valideer RLS policies in Supabase dashboard
