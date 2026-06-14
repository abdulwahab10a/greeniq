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

// Vegetation layer (ESA WorldCover): greener = denser actual planting
const vegetationStyle = (feature) => {
  const v = feature?.properties?.veg ?? 0;
  return {
    fillColor: '#16a34a',
    color: '#15803d',
    weight: 0,
    fillOpacity: 0.2 + v * 0.6,
  };
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

// Module-level cache for the vegetation layer (loaded once per session)
let cachedVegetation = null;
let cachedVegStats = null;

export default function MapComponent({ onTreeSelect, refreshKey = 0, height = '600px' }) {
  const [trees, setTrees] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [iraqBorder, setIraqBorder] = useState(cachedIraqBorder);
  const [vegetation, setVegetation] = useState(cachedVegetation);
  const [vegStats, setVegStats] = useState(cachedVegStats);
  const [showVegetation, setShowVegetation] = useState(false);
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

  // Lazy-load the (1.5 MB) vegetation layer only when the user enables it
  const toggleVegetation = () => {
    const next = !showVegetation;
    setShowVegetation(next);
    if (next && !cachedVegetation) {
      Promise.all([
        fetch('/iraq-vegetation.geojson').then(r => r.json()),
        fetch('/iraq-vegetation-stats.json').then(r => r.json()),
      ])
        .then(([geo, stats]) => {
          cachedVegetation = geo;
          cachedVegStats = stats;
          setVegetation(geo);
          setVegStats(stats);
        })
        .catch(err => console.log('خطأ في جلب طبقة الاخضرار:', err));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
    <button
      type="button"
      onClick={toggleVegetation}
      style={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000,
        background: showVegetation ? '#16a34a' : '#fff',
        color: showVegetation ? '#fff' : '#1f2937',
        border: '1px solid #16a34a', borderRadius: 8,
        padding: '6px 12px', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}
    >
      🌱 الأماكن المزروعة فعلاً
    </button>

    {showVegetation && vegStats && (
      <div style={{
        position: 'absolute', bottom: 14, left: 10, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', borderRadius: 8,
        padding: '8px 12px', fontSize: 12, color: '#1f2937',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)', maxWidth: 220,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          🌿 {vegStats.vegetated_km2.toLocaleString('en')} كم²
        </div>
        <div>أراضٍ مزروعة فعلاً في العراق</div>
        <div style={{ marginTop: 4, fontSize: 10, color: '#6b7280' }}>
          المصدر: {vegStats.source}
        </div>
      </div>
    )}

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

      {showVegetation && vegetation && (
        <GeoJSON
          key="vegetation"
          data={vegetation}
          style={vegetationStyle}
          interactive={false}
        />
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
    </div>
  );
}
