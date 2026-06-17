import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import api from '../api/axios';

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
      // فقاعات تجميع بألوان GreenIQ الخضراء، يكبر حجمها مع عدد الأشجار
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count >= 100 ? 52 : count >= 10 ? 44 : 36;
        return L.divIcon({
          className: 'greeniq-cluster',
          iconSize: L.point(size, size),
          html: `<div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#22c55e,#16a34a);
            color:#fff;font-weight:800;font-size:${count >= 100 ? 13 : 14}px;
            border:2px solid rgba(255,255,255,0.9);
            border-radius:50%;
            box-shadow:0 0 0 5px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.35);
          ">${count}</div>`,
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
      const marker = L.marker([lat, lng], { icon: treeIcon });
      marker.on('click', () => onSelectRef.current?.(tree));
      return marker;
    });
    group.addLayers(markers);
  }, [trees]);

  return null;
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
