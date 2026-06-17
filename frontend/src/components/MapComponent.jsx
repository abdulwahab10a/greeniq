import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Module-level cache: fetched once per session, never re-downloaded
let cachedIraqBorder = null;

// Single-tree marker styled with GreenIQ identity — matches the cluster bubbles:
// green gradient circle, white ring, soft glow + shadow.
const treeIcon = L.divIcon({
  className: 'greeniq-tree',
  html: `<div style="
    width:34px;height:34px;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#22c55e,#16a34a);
    border:2px solid rgba(255,255,255,0.9);
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(34,197,94,0.2), 0 4px 10px rgba(0,0,0,0.35);
    font-size:18px;line-height:1;
  ">🌳</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// The current user's own trees — amber/gold badge to stand out from others' green.
const myTreeIcon = L.divIcon({
  className: 'greeniq-tree greeniq-tree-mine',
  html: `<div style="
    width:36px;height:36px;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#fbbf24,#d97706);
    border:2px solid rgba(255,255,255,0.95);
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(245,158,11,0.3), 0 4px 10px rgba(0,0,0,0.4);
    font-size:19px;line-height:1;
  ">🌳</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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

// Fetches only the trees inside the current map viewport (debounced on pan/zoom)
// and renders them into a Leaflet marker-cluster group: nearby trees collapse
// into a single counted bubble when zoomed out, and split apart as you zoom in.
// Keeps both payloads and the number of drawn markers small at any scale.
function TreeMarkers({ onTreeSelect, refreshKey }) {
  const { user } = useAuth();
  const myId = user?._id;
  const [trees, setTrees] = useState([]);
  const debounceRef = useRef(null);
  const clusterRef = useRef(null);
  // Always call the latest onTreeSelect without re-binding every marker
  const onSelectRef = useRef(onTreeSelect);
  useEffect(() => { onSelectRef.current = onTreeSelect; }, [onTreeSelect]);

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

  // Create the cluster group once and attach it to the map
  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      // تجمّع على شكل شجرة (تاج أخضر يحمل العدد + جذع بنّي)، يكبر مع عدد الأشجار
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const canopy = count >= 100 ? 50 : count >= 10 ? 42 : 34;
        const trunkW = Math.round(canopy * 0.22);
        const trunkH = Math.round(canopy * 0.3);
        const font = count >= 100 ? 13 : 14;
        return L.divIcon({
          className: 'greeniq-cluster',
          iconSize: L.point(canopy, canopy + trunkH),
          iconAnchor: [canopy / 2, (canopy + trunkH) / 2],
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div class="greeniq-cluster-canopy" style="
              width:${canopy}px;height:${canopy}px;
              display:flex;align-items:center;justify-content:center;
              background:linear-gradient(135deg,#22c55e,#16a34a);
              color:#fff;font-weight:800;font-size:${font}px;
              border:2px solid rgba(255,255,255,0.9);
              border-radius:50% 50% 46% 46%;
              box-shadow:0 0 0 5px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.35);
            ">${count}</div>
            <div style="
              width:${trunkW}px;height:${trunkH}px;
              background:linear-gradient(180deg,#8b5a2b,#5c3a1a);
              border-radius:0 0 3px 3px;
              margin-top:-1px;
            "></div>
          </div>`,
        });
      },
    });
    clusterRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      clusterRef.current = null;
    };
  }, [map]);

  // Initial load + refetch after a new tree is planted (refreshKey changes)
  useEffect(() => {
    fetchInBounds(map);
  }, [refreshKey, fetchInBounds, map]);

  // Cleanup the pending debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Rebuild the cluster markers whenever the visible trees change
  useEffect(() => {
    const group = clusterRef.current;
    if (!group) return;
    group.clearLayers();
    const markers = trees.map((tree) => {
      const [lng, lat] = tree.location.coordinates;
      const isMine = myId && tree.userId?._id === myId;
      const marker = L.marker([lat, lng], { icon: isMine ? myTreeIcon : treeIcon });
      marker.on('click', () => onSelectRef.current?.(tree));
      return marker;
    });
    group.addLayers(markers);
  }, [trees, myId]);

  return null;
}

export default function MapComponent({ onTreeSelect, refreshKey = 0, height = '600px' }) {
  const { t } = useLang();
  const { user } = useAuth();
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
    <div style={{ position: 'relative' }}>
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

      {/* مفتاح الألوان — أسفل اليسار لتجنّب التداخل مع بطاقة الشجرة */}
      <div
        style={{
          position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000,
          background: 'rgba(10,18,7,0.82)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(135,152,106,0.3)', borderRadius: '10px',
          padding: '8px 11px', fontSize: '0.72rem', color: '#cfe1b9',
          display: 'flex', flexDirection: 'column', gap: '6px', direction: 'rtl',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)', pointerEvents: 'none',
        }}
      >
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#fbbf24,#d97706)',
              border: '1.5px solid rgba(255,255,255,0.9)',
            }} />
            {t('أشجارك')}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            border: '1.5px solid rgba(255,255,255,0.9)',
          }} />
          {t('أشجار الآخرين')}
        </div>
      </div>
    </div>
  );
}
