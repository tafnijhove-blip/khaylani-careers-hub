npm install react maplibre-gl
import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Company {
  name: string;
  lat: number;
  lng: number;
}

interface MapComponentProps {
  companies: Company[];
  apiKey: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ companies, apiKey }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: https://api.maptiler.com/maps/streets/style.json?key=${apiKey},
      center: [4.895, 52.37], // standaard in Amsterdam
      zoom: 10,
    });

    const bounds = new maplibregl.LngLatBounds();

    companies.forEach(company => {
      new maplibregl.Marker()
        .setLngLat([company.lng, company.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(company.name))
        .addTo(map);

      bounds.extend([company.lng, company.lat]);
    });

    if (companies.length > 0) {
      map.fitBounds(bounds, { padding: 50 });
    }

    return () => map.remove();
  }, [companies, apiKey]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
    />
  );
};

export default MapComponent;
import React from 'react';
import MapComponent from './MapComponent';

const companies = [
  { name: 'Bedrijf A', lat: 52.37, lng: 4.89 },
  { name: 'Bedrijf B', lat: 52.38, lng: 4.90 },
  { name: 'Bedrijf C', lat: 52.36, lng: 4.88 },
];

const App = () => {
  return (
    <div>
      <h1>Onze Bedrijven</h1>
      <MapComponent companies={companies} apiKey="JE_MAPTILER_API_KEY_HIER" />
    </div>
  );
};

export default App;
npm start