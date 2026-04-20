import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wind, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useColors } from '../context/ThemeContext';

// EPA formula: PM2.5 µg/m³ → AQI
function pm25ToAqi(pm) {
  if (pm == null) return null;
  const breakpoints = [
    [0,    12,    0,   50],
    [12.1, 35.4,  51,  100],
    [35.5, 55.4,  101, 150],
    [55.5, 150.4, 151, 200],
    [150.5,250.4, 201, 300],
    [250.5,350.4, 301, 400],
    [350.5,500.4, 401, 500],
  ];
  for (const [lo, hi, aqiLo, aqiHi] of breakpoints) {
    if (pm >= lo && pm <= hi) {
      return Math.round(((aqiHi - aqiLo) / (hi - lo)) * (pm - lo) + aqiLo);
    }
  }
  return 500;
}

function getAqiCategory(aqi) {
  if (aqi === null || aqi === undefined) {
    return { label: 'غير متاح', color: '#6b7280', barColor: '#374151', purity: null, emoji: '❓' };
  }
  const purity = Math.max(0, Math.round(100 - (aqi / 300) * 100));
  if (aqi <= 50)  return { label: 'جيد',            color: '#4ade80', barColor: '#16a34a', purity, emoji: '😊' };
  if (aqi <= 100) return { label: 'مقبول',           color: '#facc15', barColor: '#ca8a04', purity, emoji: '😐' };
  if (aqi <= 150) return { label: 'غير صحي نسبياً', color: '#fb923c', barColor: '#ea580c', purity, emoji: '😷' };
  if (aqi <= 200) return { label: 'غير صحي',         color: '#f87171', barColor: '#dc2626', purity, emoji: '🤢' };
  if (aqi <= 300) return { label: 'خطر شديد',        color: '#c084fc', barColor: '#9333ea', purity, emoji: '☠️' };
  return           { label: 'كارثي',                 color: '#f43f5e', barColor: '#be123c', purity: 0,  emoji: '☣️' };
}

function PurityBar({ purity, color }) {
  return (
    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: purity !== null ? `${purity}%` : '0%' }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        style={{ height: '100%', background: color, borderRadius: '99px' }}
      />
    </div>
  );
}

function ProvinceCard({ province, index, C }) {
  const aqi = province.aqi;
  const { label, color, barColor, purity, emoji } = getAqiCategory(aqi);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.7), duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: C.cardBg,
        border: `1px solid ${aqi !== null ? color + '35' : C.cardBorder}`,
        borderRadius: '16px',
        padding: '1rem 1.1rem',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ color: C.heading, fontWeight: '700', fontSize: '0.95rem', margin: '0 0 4px' }}>
            {province.name}
          </h3>
          {province.pm25 !== null && (
            <p style={{ color: C.textFaint, fontSize: '0.68rem', margin: 0 }}>
              PM2.5: {province.pm25} µg/m³
              {province.pm10 !== null && `  ·  PM10: ${province.pm10} µg/m³`}
            </p>
          )}
        </div>

        {aqi !== null ? (
          <div style={{ textAlign: 'left', flexShrink: 0 }}>
            <div style={{ color, fontSize: '1.3rem', fontWeight: '800', lineHeight: 1 }}>{aqi}</div>
            <div style={{ color: 'rgba(207,225,185,0.35)', fontSize: '0.65rem', marginTop: '1px' }}>AQI</div>
          </div>
        ) : (
          <AlertCircle size={18} color="#6b7280" />
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <span style={{
          fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px',
          background: aqi !== null ? color + '18' : 'rgba(107,114,128,0.1)',
          color: aqi !== null ? color : '#6b7280',
          border: `1px solid ${aqi !== null ? color + '30' : 'rgba(107,114,128,0.2)'}`,
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {emoji} {label}
        </span>

        {purity !== null && (
          <span style={{ color, fontSize: '0.85rem', fontWeight: '800' }}>
            {purity}%
            <span style={{ color: 'rgba(207,225,185,0.3)', fontSize: '0.65rem', fontWeight: '400', marginRight: '3px' }}>نقاء</span>
          </span>
        )}
      </div>

      <PurityBar purity={purity} color={barColor} />
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
      {[...Array(18)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      ))}
    </div>
  );
}

export default function AirQualityPage() {
  const C = useColors();
  const [provinces, setProvinces] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await api.get('/air-quality');
      const data = res.data;

      const enriched = data.provinces.map(p => ({
        ...p,
        aqi: pm25ToAqi(p.pm25),
      }));
      enriched.sort((a, b) => (a.aqi ?? 9999) - (b.aqi ?? 9999));

      setProvinces(enriched);
      setUpdatedAt(new Date(data.updatedAt));
    } catch {
      setError('تعذّر تحميل بيانات جودة الهواء، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const available = provinces.filter(p => p.aqi !== null);
  const avgAqi = available.length > 0
    ? Math.round(available.reduce((s, p) => s + p.aqi, 0) / available.length)
    : null;
  const avgCat = getAqiCategory(avgAqi);

  return (
    <div className="max-w-3xl mx-auto" style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '1.75rem' }}
      >
        <h1 style={{
          fontSize: '1.9rem', fontWeight: '800', margin: '0 0 0.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          <Wind size={26} color="#90a955" />
          <span key={String(C.L)} style={{
            background: C.headingGrad, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block',
          }}>جودة الهواء في العراق</span>
        </h1>
        <p style={{ fontSize: '0.85rem', color: C.textSubtle, margin: '0 0 1rem' }}>
          قراءات حية للمحافظات الـ 18 · مصدر: Open-Meteo Air Quality API
        </p>

        {avgAqi !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center',
              background: avgCat.color + '12', border: `1px solid ${avgCat.color}30`,
              borderRadius: '999px', padding: '6px 18px', fontSize: '0.82rem',
            }}
          >
            <span style={{ color: avgCat.color, fontWeight: '700' }}>متوسط AQI في العراق: {avgAqi}</span>
            <span style={{ color: 'rgba(207,225,185,0.3)' }}>·</span>
            <span style={{ color: avgCat.color }}>{avgCat.emoji} {avgCat.label}</span>
            <span style={{ color: 'rgba(207,225,185,0.3)' }}>·</span>
            <span style={{ color: avgCat.color, fontWeight: '700' }}>{avgCat.purity}% نقاء</span>
          </motion.div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '14px', padding: '1rem 1.25rem', textAlign: 'center',
          color: '#f87171', fontSize: '0.9rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Toolbar */}
      {!loading && provinces.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ color: 'rgba(207,225,185,0.3)', fontSize: '0.72rem', margin: 0 }}>
            {updatedAt
              ? `آخر تحديث: ${updatedAt.toLocaleTimeString('ar-IQ')} · البيانات مخزنة مؤقتاً لمدة ساعة في السيرفر`
              : ''}
          </p>

          <motion.button
            onClick={() => load(true)}
            disabled={refreshing}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(135,152,106,0.12)', border: '1px solid rgba(135,152,106,0.25)',
              color: '#90a955', borderRadius: '10px', padding: '6px 14px',
              fontSize: '0.8rem', fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </motion.button>
        </div>
      )}

      {/* AQI Legend */}
      {!loading && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem',
          background: 'rgba(10,18,7,0.5)', border: '1px solid rgba(135,152,106,0.12)',
          borderRadius: '12px', padding: '10px 14px',
        }}>
          {[
            { range: '0-50',    label: 'جيد',            color: '#4ade80' },
            { range: '51-100',  label: 'مقبول',           color: '#facc15' },
            { range: '101-150', label: 'غير صحي نسبياً', color: '#fb923c' },
            { range: '151-200', label: 'غير صحي',         color: '#f87171' },
            { range: '200+',    label: 'خطر',             color: '#c084fc' },
          ].map(item => (
            <span key={item.range} style={{
              fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '5px',
              color: 'rgba(207,225,185,0.55)',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
              AQI {item.range}: {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? <LoadingSkeleton /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {provinces.map((prov, i) => (
            <ProvinceCard key={prov.name} province={prov} index={i} C={C} />
          ))}
        </div>
      )}

      {/* Attribution */}
      {!loading && (
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(207,225,185,0.2)', marginTop: '1.5rem' }}>
          البيانات مقدمة من{' '}
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer"
            style={{ color: 'rgba(144,169,85,0.5)', textDecoration: 'none' }}>
            Open-Meteo Air Quality API
          </a>
          {' '}· مؤشر AQI محسوب من PM2.5 بمعادلة EPA الأمريكية
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
