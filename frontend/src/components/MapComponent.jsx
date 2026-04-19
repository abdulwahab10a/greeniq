import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import api from '../api/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Module-level cache: fetched once per session, never re-downloaded
let cachedIraqBorder = null;

const treeIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:22px;line-height:1;">🌳</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:22px;line-height:1;">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const iraqStyle = {
  fillColor: '#87986a',
  weight: 2,
  opacity: 1,
  color: '#718355',
  fillOpacity: 0.1,
};

// Lightweight Iraq-only GeoJSON (bounding box polygon — no heavy download)
const IRAQ_BBOX = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [38.79, 29.06], [48.57, 29.06],
        [48.57, 37.38], [38.79, 37.38],
        [38.79, 29.06],
      ]],
    },
    properties: {},
  }],
};

async function fetchIraqBorder() {
  if (cachedIraqBorder) return cachedIraqBorder;
  try {
    // Specific Iraq GeoJSON — much smaller than fetching all countries
    const res = await fetch('https://nominatim.openstreetmap.org/search.php?country=iraq&polygon_geojson=1&format=json');
    const data = await res.json();
    if (data[0]?.geojson) {
      cachedIraqBorder = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: data[0].geojson, properties: {} }],
      };
      return cachedIraqBorder;
    }
  } catch {
    // ignore
  }
  cachedIraqBorder = IRAQ_BBOX;
  return cachedIraqBorder;
}

export default function MapComponent({ onTreeSelect, refreshKey = 0 }) {
  const [trees, setTrees] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [iraqBorder, setIraqBorder] = useState(cachedIraqBorder);
  const geolocationDone = useRef(false);

  useEffect(() => {
    fetchIraqBorder().then(setIraqBorder);

    if (!geolocationDone.current && navigator.geolocation) {
      geolocationDone.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    api.get('/trees')
      .then(res => setTrees(res.data))
      .catch(err => console.log('خطأ في جلب الأشجار:', err));
  }, [refreshKey]);

  return (
    <MapContainer
      center={[33.2232, 43.6793]}
      zoom={6}
      minZoom={5}
      maxZoom={18}
      maxBounds={[[28.5, 38.0], [38.0, 49.5]]}
      maxBoundsViscosity={1.0}
      style={{ height: '600px', borderRadius: '12px', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {iraqBorder && (
        <GeoJSON data={iraqBorder} style={iraqStyle} />
      )}

      {userLocation && (
        <Marker position={userLocation} icon={userIcon} />
      )}

      {trees.map((tree) => {
        const [lng, lat] = tree.location.coordinates;
        return (
          <Marker
            key={tree._id}
            position={[lat, lng]}
            icon={treeIcon}
            eventHandlers={{ click: () => onTreeSelect?.(tree) }}
          />
        );
      })}
    </MapContainer>
  );
}
