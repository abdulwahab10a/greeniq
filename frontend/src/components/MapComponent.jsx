import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
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

// Fetches & renders only the trees inside the current map viewport.
// Refetches (debounced) whenever the user pans/zooms — keeps payloads small
// even when the dataset grows to thousands of trees.
function TreeMarkers({ onTreeSelect, refreshKey }) {
  const [trees, setTrees] = useState([]);
  const debounceRef = useRef(null);

  const fetchInBounds = useCallback((map) => {
    const b = map.getBounds();
    const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',');
    api.get('/trees', { params: { bbox } })
      .then((res) => setTrees(res.data))
      .catch((err) => console.log('خطأ في جلب الأشجار:', err));
  }, []);

  const map = useMapEvents({
    moveend: () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchInBounds(map), 300);
    },
  });

  // Initial load + refetch after a new tree is planted (refreshKey changes)
  useEffect(() => {
    fetchInBounds(map);
  }, [refreshKey, fetchInBounds, map]);

  // Cleanup the pending debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return trees.map((tree) => {
    const [lng, lat] = tree.location.coordinates;
    return (
      <Marker
        key={tree._id}
        position={[lat, lng]}
        icon={treeIcon}
        eventHandlers={{ click: () => onTreeSelect?.(tree) }}
      />
    );
  });
}

export default function MapComponent({ onTreeSelect, refreshKey = 0, height = '600px' }) {
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

  return (
    <MapContainer
      center={[33.2232, 43.6793]}
      zoom={6}
      minZoom={5}
      maxZoom={18}
      maxBounds={[[28.5, 38.0], [38.0, 49.5]]}
      maxBoundsViscosity={1.0}
      style={{ height, borderRadius: '12px', zIndex: 0 }}
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

      <TreeMarkers onTreeSelect={onTreeSelect} refreshKey={refreshKey} />
    </MapContainer>
  );
}
