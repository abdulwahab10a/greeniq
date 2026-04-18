import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import api from '../api/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapComponent({ onTreeSelect, onViewProfile, refreshKey = 0 }) {
  const [trees, setTrees] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [iraqBorder, setIraqBorder] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        const iraq = {
          type: 'FeatureCollection',
          features: data.features.filter(f => f.properties.ADMIN === 'Iraq')
        };
        setIraqBorder(iraq);
      })
      .catch(() => {
        fetch('https://nominatim.openstreetmap.org/search.php?country=iraq&polygon_geojson=1&format=json')
          .then(res => res.json())
          .then(data => {
            if (data[0]?.geojson) {
              setIraqBorder({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: data[0].geojson, properties: {} }]
              });
            }
          })
          .catch(err => console.log('فشل تحميل الحدود:', err));
      });

    if (navigator.geolocation) {
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

  const iraqStyle = {
    fillColor: '#87986a',
    weight: 2,
    opacity: 1,
    color: '#718355',
    fillOpacity: 0.1,
  };

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

      {/* حدود العراق الدقيقة */}
      {iraqBorder && (
        <GeoJSON data={iraqBorder} style={iraqStyle} />
      )}

      {/* موقع المستخدم */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>📍 موقعك الحالي</Popup>
        </Marker>
      )}

      {/* علامات الأشجار */}
      {trees.map((tree) => {
        const [lng, lat] = tree.location.coordinates;
        return (
          <Marker
            key={tree._id}
            position={[lat, lng]}
            icon={treeIcon}
            eventHandlers={{ click: () => onTreeSelect?.(tree) }}
          >
            <Popup>
              <div style={{ minWidth: '200px', direction: 'rtl', fontFamily: 'inherit', background: '#1f2937', borderRadius: '8px', padding: '10px', margin: '-10px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                  تمت زراعة هذه الشجرة بواسطة:{' '}
                  <strong style={{ color: '#4ade80' }}>{tree.userId?.displayName || 'مستخدم'}</strong>
                </p>
                <h4 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: '#f9fafb' }}>
                  🌳 {tree.name || 'شجرة'}
                </h4>
                {tree.notes && (
                  <p style={{ fontSize: '11px', marginBottom: '6px', color: '#d1d5db' }}>
                    {tree.notes}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <span style={{ background: '#14532d', color: '#86efac', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                    🌿 CO₂ المختزل: <strong>{tree.co2Absorbed} كجم</strong>
                  </span>
                  <span style={{ background: '#1e3a5f', color: '#93c5fd', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                    💨 O₂ المنبعث: <strong>{tree.o2Produced} كجم</strong>
                  </span>
                </div>
                {tree.userId?._id && (
                  <button
                    onClick={() => onViewProfile?.(tree.userId._id)}
                    style={{
                      marginTop: '8px', width: '100%',
                      background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                      borderRadius: '7px', padding: '5px 10px',
                      color: '#4ade80', fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    }}
                  >
                    👤 عرض الملف الشخصي
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}