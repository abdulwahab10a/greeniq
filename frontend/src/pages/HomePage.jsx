import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TreePine, Wind, Sprout } from 'lucide-react';
import { useColors } from '../context/ThemeContext';

function useCountUp(target, duration = 1400) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target == null || target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';

// ── Province coordinates (for nearest-match detection) ──────────────────────
const PROVINCES = [
  { name: 'بغداد',        lat: 33.3152, lng: 44.3661 },
  { name: 'البصرة',       lat: 30.5085, lng: 47.7804 },
  { name: 'نينوى',        lat: 36.3566, lng: 43.1584 },
  { name: 'أربيل',        lat: 36.1912, lng: 44.0092 },
  { name: 'النجف',        lat: 31.9971, lng: 44.3318 },
  { name: 'كربلاء',       lat: 32.6160, lng: 44.0249 },
  { name: 'السليمانية',   lat: 35.5571, lng: 45.4367 },
  { name: 'دهوك',         lat: 36.8669, lng: 42.9503 },
  { name: 'الأنبار',      lat: 33.4258, lng: 43.3000 },
  { name: 'ديالى',        lat: 33.7732, lng: 44.6880 },
  { name: 'كركوك',        lat: 35.4681, lng: 44.3922 },
  { name: 'واسط',         lat: 32.4926, lng: 45.8268 },
  { name: 'بابل',         lat: 32.4740, lng: 44.4220 },
  { name: 'ميسان',        lat: 31.8290, lng: 47.1504 },
  { name: 'ذي قار',       lat: 31.0603, lng: 46.2754 },
  { name: 'المثنى',       lat: 29.3685, lng: 45.2899 },
  { name: 'القادسية',     lat: 32.0449, lng: 44.9259 },
  { name: 'صلاح الدين',   lat: 34.5338, lng: 43.4759 },
];

function nearestProvince(lat, lng) {
  let best = PROVINCES[0], bestDist = Infinity;
  for (const p of PROVINCES) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best.name;
}

// ── PM2.5 → AQI ─────────────────────────────────────────────────────────────
function pm25ToAqi(pm) {
  if (pm == null) return null;
  const bp = [
    [0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500],
  ];
  for (const [lo, hi, aLo, aHi] of bp) {
    if (pm >= lo && pm <= hi)
      return Math.round(((aHi - aLo) / (hi - lo)) * (pm - lo) + aLo);
  }
  return 500;
}

function aqiMeta(aqi) {
  if (aqi == null) return { color: '#6b7280', label: 'غير متاح' };
  if (aqi <= 50)  return { color: '#4ade80', label: 'جيد' };
  if (aqi <= 100) return { color: '#facc15', label: 'مقبول' };
  if (aqi <= 150) return { color: '#fb923c', label: 'غير صحي نسبياً' };
  if (aqi <= 200) return { color: '#f87171', label: 'غير صحي' };
  if (aqi <= 300) return { color: '#c084fc', label: 'خطر شديد' };
  return           { color: '#f43f5e', label: 'كارثي' };
}

// ── AQI Gauge (SVG semicircle) ───────────────────────────────────────────────
function AqiGauge({ aqi }) {
  const max = 300;
  const clamped = Math.min(aqi ?? 0, max);
  const pct = clamped / max;
  const { color } = aqiMeta(aqi);

  // Arc: center (60,60), radius 48, sweep from 180° to 0° (left→right semicircle)
  const cx = 60, cy = 60, r = 48;
  const startAngle = Math.PI;                       // 180°
  const endAngle   = startAngle - pct * Math.PI;    // sweeps leftward = higher value → right

  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;

  // Track arc (grey)
  const tx1 = cx + r * Math.cos(Math.PI);
  const ty1 = cy + r * Math.sin(Math.PI);
  const tx2 = cx + r * Math.cos(0);
  const ty2 = cy + r * Math.sin(0);

  return (
    <svg viewBox="0 0 120 68" style={{ width: '120px', height: '68px' }}>
      {/* Track */}
      <path
        d={`M ${tx1} ${ty1} A ${r} ${r} 0 0 1 ${tx2} ${ty2}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round"
      />
      {/* Value arc */}
      {aqi != null && pct > 0 && (
        <path
          d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        />
      )}
      {/* Center value */}
      <text x="60" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill={color ?? '#6b7280'}>
        {aqi ?? '—'}
      </text>
    </svg>
  );
}

// ── Tree Card ────────────────────────────────────────────────────────────────
function TreeCard({ count, province, loading }) {
  const C = useColors();
  const animated = useCountUp(loading ? 0 : (count ?? 0));
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      style={{
        flex: 1, minWidth: 0,
        background: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '20px',
        padding: '1.4rem 1.2rem',
        backdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        textAlign: 'center',
      }}
    >
      <div style={{
        fontSize: '0.75rem', fontWeight: '700', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        زراعة الأشجار
      </div>

      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'rgba(74,222,128,0.1)', border: '1.5px solid rgba(74,222,128,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TreePine size={26} color="#4ade80" />
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: '8px' }} />
      ) : (
        <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#4ade80', lineHeight: 1 }}>
          {animated}
        </div>
      )}

      <div style={{ fontSize: '0.78rem', color: C.textMuted }}>
        شجرة مزروعة
      </div>

      {province && (
        <div style={{
          marginTop: '4px', fontSize: '0.7rem', fontWeight: '600',
          color: 'rgba(144,169,85,0.7)',
          background: 'rgba(144,169,85,0.08)', border: '1px solid rgba(144,169,85,0.18)',
          borderRadius: '99px', padding: '2px 10px',
        }}>
          {province}
        </div>
      )}
    </motion.div>
  );
}

// ── Air Quality Card ─────────────────────────────────────────────────────────
function AirCard({ aqi, province, loading }) {
  const C = useColors();
  const { color, label } = aqiMeta(aqi);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      style={{
        flex: 1, minWidth: 0,
        background: C.cardBg,
        border: `1px solid ${aqi != null ? color + '30' : C.cardBorder}`,
        borderRadius: '20px',
        padding: '1.4rem 1.2rem',
        backdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        textAlign: 'center',
      }}
    >
      <div style={{
        fontSize: '0.75rem', fontWeight: '700', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        مؤشر جودة الهواء
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '120px', height: '68px', borderRadius: '8px' }} />
      ) : (
        <AqiGauge aqi={aqi} />
      )}

      {province && (
        <div style={{ fontSize: '0.72rem', color: C.textSubtle }}>
          {province}
        </div>
      )}

      <span style={{
        fontSize: '0.72rem', fontWeight: '700',
        color, background: color + '16',
        border: `1px solid ${color}28`,
        borderRadius: '99px', padding: '2px 10px',
      }}>
        {label}
      </span>

      <div style={{
        display: 'flex', gap: '5px', marginTop: '2px',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {['#4ade80', '#facc15', '#fb923c', '#f87171', '#c084fc'].map((c, i) => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: c,
            opacity: aqi != null && i === Math.min(Math.floor((aqi - 1) / 60), 4) ? 1 : 0.25,
          }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const C = useColors();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [province, setProvince]     = useState(null);
  const [treeCount, setTreeCount]   = useState(null);
  const [aqi, setAqi]               = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [siteStats, setSiteStats]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData(lat, lng) {
      const prov = nearestProvince(lat, lng);
      if (cancelled) return;
      setProvince(prov);

      const [govRes, aqiRes] = await Promise.allSettled([
        api.get('/trees/governorates'),
        api.get('/air-quality'),
      ]);

      if (cancelled) return;

      if (govRes.status === 'fulfilled') {
        const gov = govRes.value.data.find(g => g.name === prov);
        setTreeCount(gov?.treesCount ?? 0);
      }

      if (aqiRes.status === 'fulfilled') {
        const aqiProv = aqiRes.value.data.provinces.find(p => p.name === prov);
        if (aqiProv?.pm25 != null) setAqi(pm25ToAqi(aqiProv.pm25));
      }

      setLoadingCards(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadData(pos.coords.latitude, pos.coords.longitude),
        () => {
          // fallback: default to Baghdad
          if (!cancelled) loadData(33.3152, 44.3661);
        },
        { timeout: 6000 }
      );
    } else {
      loadData(33.3152, 44.3661);
    }

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    api.get('/trees/stats').then(res => setSiteStats(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '2rem' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '2rem 1rem 1.75rem' }}>
        <motion.h1
          key={String(C.L)}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontSize: 'clamp(3rem, 11vw, 6rem)',
            fontWeight: 900,
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #90a955 0%, #4f772d 55%, #31572c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          GreenIQ
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
            color: C.textMuted,
            fontWeight: 400,
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.75,
          }}
        >
          من أجل مستقبل أخضر لعراقنا
        </motion.p>

        {user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{ marginTop: '1.25rem', color: C.textFaint, fontSize: '0.9rem' }}
          >
            أهلاً بك،{' '}
            <span style={{ color: '#90a955', fontWeight: 600 }}>{user.displayName}</span>
          </motion.p>
        )}
      </div>

      {/* ── Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ display: 'flex', gap: '14px', marginBottom: '1.5rem', padding: '0 0.25rem' }}
      >
        <TreeCard count={treeCount} province={province} loading={loadingCards} />
        <AirCard  aqi={aqi}        province={province} loading={loadingCards} />
      </motion.div>

      {/* ── Site Stats Banner ── */}
      {siteStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: '6px 18px',
            background: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '14px', padding: '0.7rem 1.2rem',
            marginBottom: '1.5rem', fontSize: '0.8rem',
          }}
        >
          <span style={{ color: C.textMuted, fontWeight: '500' }}>
            🌍 إجمالي الأشجار في العراق:
            <span style={{ color: '#4ade80', fontWeight: '800', marginRight: '5px' }}>{siteStats.totalTrees.toLocaleString('ar-IQ')}</span>
          </span>
          <span style={{ color: C.textFaint }}>|</span>
          <span style={{ color: C.textMuted, fontWeight: '500' }}>
            CO₂ ممتص:
            <span style={{ color: '#86efac', fontWeight: '800', marginRight: '5px' }}>{siteStats.totalCO2.toLocaleString('ar-IQ')} كجم</span>
          </span>
          <span style={{ color: C.textFaint }}>|</span>
          <span style={{ color: C.textMuted, fontWeight: '500' }}>
            O₂ منتج:
            <span style={{ color: '#93c5fd', fontWeight: '800', marginRight: '5px' }}>{siteStats.totalO2.toLocaleString('ar-IQ')} كجم</span>
          </span>
        </motion.div>
      )}

      {/* ── Progress Map ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
        style={{
          background: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '20px',
          padding: '1.1rem',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.9rem', padding: '0 0.2rem',
        }}>
          <span style={{ fontWeight: '700', color: C.heading, fontSize: '0.95rem' }}>
            خريطة العراق الأخضر
          </span>
          <span style={{
            fontSize: '0.72rem', color: '#90a955', fontWeight: '600',
            background: 'rgba(144,169,85,0.1)', border: '1px solid rgba(144,169,85,0.22)',
            borderRadius: '99px', padding: '2px 10px',
          }}>
            مباشر
          </span>
        </div>

        <MapComponent height="340px" />

        {/* ── Plant CTA button ── */}
        <motion.button
          onClick={() => navigate('/map')}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px',
            width: '100%', marginTop: '1rem',
            padding: '0.85rem 1.5rem',
            background: 'linear-gradient(135deg, #4f772d, #90a955)',
            border: 'none', borderRadius: '14px',
            color: '#f0f9e8', fontSize: '1rem', fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(144,169,85,0.35)',
            letterSpacing: '0.01em',
          }}
        >
          <Sprout size={20} />
          ازرع شجرة الآن
        </motion.button>
      </motion.div>
    </div>
  );
}
