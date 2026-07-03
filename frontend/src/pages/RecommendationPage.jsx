import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Loader2, Crosshair, TreePine, AlertTriangle, Ban, Droplets, Wind, ThermometerSun, CloudRain, Mountain, FlaskConical } from 'lucide-react';
import api from '../api/axios';
import { useColors } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

// دبوس اختيار الموقع — أيقونة مستقلة حتى لا نعتمد على تحميل MapComponent
const pickIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const SOIL_LABEL = {
  clay:    { ar: 'طينية', en: 'Clay' },
  saline:  { ar: 'ملحية', en: 'Saline' },
  sandy:   { ar: 'رملية', en: 'Sandy' },
  loamy:   { ar: 'طميية', en: 'Loamy' },
  mountain:{ ar: 'جبلية', en: 'Mountain' },
};
const SAL_LABEL = { 1: { ar: 'منخفضة', en: 'Low' }, 2: { ar: 'متوسطة', en: 'Moderate' }, 3: { ar: 'عالية', en: 'High' } };
const SAL_COLOR = { 1: '#16a34a', 2: '#d97706', 3: '#dc2626' };

// يلتقط نقر المستخدم على الخريطة ويعيد الإحداثيات
function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// شارة مصدر البيانات (حقيقي / تقدير)
function SourceBadge({ real }) {
  const { t } = useLang();
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '5px',
      background: real ? 'rgba(22,163,74,0.15)' : 'rgba(217,119,6,0.15)',
      color: real ? '#4ade80' : '#fbbf24',
      border: `1px solid ${real ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
    }}>
      {real ? `✅ ${t('حقيقي')}` : `⚠️ ${t('تقدير')}`}
    </span>
  );
}

export default function RecommendationPage() {
  const C = useColors();
  const { t, lang } = useLang();
  const [pos, setPos] = useState(null);          // [lat, lng]
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cities, setCities] = useState([]);
  const mapRef = useRef(null);

  const pick = (arabic, english) => (lang === 'ar' ? arabic : english);

  // قائمة المدن للاختيار السريع
  useEffect(() => {
    api.get('/recommendation/cities').then((r) => setCities(r.data)).catch(() => {});
  }, []);

  const fetchRecommendation = useCallback(async (lat, lng) => {
    setPos([lat, lng]);
    setLoading(true);
    setError('');
    setResult(null);
    if (mapRef.current) mapRef.current.flyTo([lat, lng], 9, { duration: 0.8 });
    try {
      const { data } = await api.get('/recommendation', { params: { lat, lng } });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || t('تعذّر توليد التوصية، يرجى المحاولة لاحقاً'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) { setError(t('المتصفح لا يدعم تحديد الموقع')); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => fetchRecommendation(p.coords.latitude, p.coords.longitude),
      () => { setLoading(false); setError(t('تعذّر تحديد موقعك، يرجى السماح بالوصول إلى الموقع')); }
    );
  };

  const rec = result?.recommendation;
  const env = result?.environment;
  const tree = rec?.tree;

  return (
    <div className="space-y-4" style={{ direction: 'rtl' }}>
      {/* العنوان */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={22} color="#87986a" />
          <span key={String(C.L)} style={{
            background: C.headingGrad, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block',
          }}>{t('أي شجرة أزرع؟')}</span>
        </h1>
      </div>
      <p style={{ color: C.textMuted, fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
        {t('اختر موقعاً على الخريطة أو استخدم موقعك، ليقترح الذكاء الاصطناعي الشجرة الأنسب لمناخ وتربة وملوحة ذلك المكان في العراق.')}
      </p>

      {/* أدوات الاختيار */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <motion.button
          onClick={useMyLocation}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          className="btn-primary"
          style={{ padding: '0.55rem 1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <Crosshair size={15} /> {t('استخدم موقعي')}
        </motion.button>
        <span style={{ color: C.textFaint, fontSize: '0.8rem' }}>{t('أو انقر على الخريطة، أو اختر مدينة:')}</span>
      </div>

      {/* رقائق المدن */}
      {cities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {cities.map((c) => (
            <button key={c.name} onClick={() => fetchRecommendation(c.lat, c.lng)}
              style={{
                background: 'rgba(135,152,106,0.1)', border: '1px solid rgba(135,152,106,0.28)',
                color: '#90a955', borderRadius: '99px', padding: '4px 12px',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(135,152,106,0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(135,152,106,0.1)'; }}
            >
              {t(c.name)}
            </button>
          ))}
        </div>
      )}

      {/* الخريطة */}
      <div style={{ position: 'relative' }}>
        <MapContainer
          center={[33.2232, 43.6793]}
          zoom={6} minZoom={5} maxZoom={18}
          maxBounds={[[28.5, 38.0], [38.0, 49.5]]}
          maxBoundsViscosity={1.0}
          style={{ height: '420px', borderRadius: '12px', zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickPicker onPick={fetchRecommendation} />
          {pos && <Marker position={pos} icon={pickIcon} />}
        </MapContainer>

        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1000, borderRadius: '12px',
            background: 'rgba(10,18,7,0.55)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            color: '#cfe1b9', fontSize: '0.9rem', fontWeight: 600,
          }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={18} />
            </motion.div>
            {t('جاري تحليل الموقع...')}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          fontSize: '0.85rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)', padding: '0.6rem 0.85rem', borderRadius: '10px',
        }}>
          {error}
        </div>
      )}

      {/* بطاقة النتيجة */}
      <AnimatePresence mode="wait">
        {result && rec && env && (
          <motion.div
            key={`${env.lat},${env.lng}`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card"
            style={{ borderRadius: '20px', overflow: 'hidden' }}
          >
            {/* رأس البطاقة — الموقع */}
            <div style={{
              background: `linear-gradient(135deg, ${tree.color}, ${tree.color}bb)`,
              color: 'white', padding: '0.9rem 1.2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px',
            }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MapPin size={18} /> {env.governorate ? t(env.governorate) : t(env.nearestCity)}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {Number(env.lat).toFixed(3)}، {Number(env.lng).toFixed(3)}
              </span>
            </div>

            <div style={{ padding: '1.1rem 1.2rem' }}>
              {/* الشجرة الموصى بها */}
              <div style={{
                background: `${tree.color}14`, border: `1.5px solid ${tree.color}`,
                borderRadius: '14px', padding: '1rem 1.1rem', marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{tree.emoji}</span>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tree.color }}>
                      {pick(tree.nameAr, tree.nameEn)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: C.textMuted, fontWeight: 600 }}>
                      {t('نسبة الثقة')}: {rec.confidence}%
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: C.text, margin: '0.4rem 0 0', lineHeight: 1.6 }}>
                  {pick(tree.reasonAr, tree.reasonEn)}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem',
                  fontSize: '0.8rem', color: C.textMuted,
                }}>
                  <Droplets size={13} color="#93c5fd" /> {pick(tree.careAr, tree.careEn)}
                </div>
              </div>

              {/* أشرطة احتمالات الأشجار الست */}
              <div style={{
                background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                borderRadius: '12px', padding: '0.8rem 0.9rem', marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} /> {t('توصية الذكاء الاصطناعي — 6 أشجار')}
                </div>
                {rec.probabilities.filter((p) => p.percent > 0).map((p) => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                    <span style={{ width: '68px', fontSize: '0.76rem', color: C.text, flexShrink: 0 }}>
                      {p.emoji} {pick(p.nameAr, p.nameEn)}
                    </span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '7px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${p.percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', background: p.color, borderRadius: '4px' }}
                      />
                    </div>
                    <span style={{ width: '34px', fontSize: '0.74rem', color: C.textMuted, textAlign: 'left', flexShrink: 0 }}>{p.percent}%</span>
                  </div>
                ))}
              </div>

              {/* بيانات الموقع البيئية */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '1rem' }}>
                <EnvCell icon={<ThermometerSun size={14} color="#f87171" />} label={t('الحرارة')} value={`${env.temp}°C`} real={env.tempReal} />
                <EnvCell icon={<Droplets size={14} color="#60a5fa" />} label={t('رطوبة التربة')} value={`${env.moisture}%`} real={env.moistureReal} />
                <EnvCell icon={<CloudRain size={14} color="#38bdf8" />} label={t('أمطار سنوية')} value={`${env.rain} mm`} real={env.rainReal} sub="2023" />
                <EnvCell icon={<Mountain size={14} color="#a78bfa" />} label={t('نوع التربة')} value={pick(SOIL_LABEL[env.soil]?.ar, SOIL_LABEL[env.soil]?.en) || env.soil} real={env.soilReal}
                  sub={env.sand != null ? pick(`${env.sand}% رمل، ${env.clay}% طين`, `${env.sand}% sand, ${env.clay}% clay`) : null} />
                <EnvCell icon={<FlaskConical size={14} color={SAL_COLOR[env.salinity]} />} label={t('الملوحة')}
                  value={<span style={{ color: SAL_COLOR[env.salinity] }}>{env.salinity}/3 — {pick(SAL_LABEL[env.salinity]?.ar, SAL_LABEL[env.salinity]?.en)}</span>}
                  real={false} sub={pick(env.salinityNoteAr, env.salinityNoteEn)} />
                <EnvCell icon={<Wind size={14} color="#fbbf24" />} label={t('مؤشر الجفاف')} value={rec.features.aridityIdx} plain
                  sub={t('أمطار ÷ حرارة')} />
              </div>

              {/* التحذيرات */}
              {rec.warnings.length > 0 && (
                <div style={{
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.28)',
                  borderRadius: '12px', padding: '0.7rem 0.9rem', marginBottom: '0.8rem',
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} /> {t('تحذيرات')}
                  </div>
                  {rec.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#fcd34d', margin: '2px 0' }}>{pick(w.ar, w.en)}</div>
                  ))}
                </div>
              )}

              {/* لا تزرع هنا */}
              <div style={{
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px', padding: '0.7rem 0.9rem', marginBottom: '0.8rem',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ban size={13} /> {t('لا تزرع هنا')}
                </div>
                {rec.nogo.map((n, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', margin: '2px 0' }}>• {pick(n.ar, n.en)}</div>
                ))}
              </div>

              {/* أشجار موجودة */}
              <div style={{
                background: env.hasTrees ? 'rgba(59,130,246,0.08)' : 'rgba(22,163,74,0.08)',
                border: `1px solid ${env.hasTrees ? 'rgba(59,130,246,0.28)' : 'rgba(74,222,128,0.25)'}`,
                borderRadius: '12px', padding: '0.65rem 0.9rem',
                fontSize: '0.8rem', color: env.hasTrees ? '#93c5fd' : '#4ade80',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}>
                <TreePine size={14} />
                {env.hasTrees
                  ? `${env.treeCount} ${t('شجرة مسجّلة في OpenStreetMap قرب هذا الموقع')}`
                  : t('لا توجد أشجار مسجّلة — الموقع جاهز للزراعة')}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.68rem', color: C.textFaint, marginTop: '0.7rem' }}>
                Open-Meteo · SoilGrids · OpenStreetMap · {t('تقدير الملوحة جغرافياً')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// خلية بيانات بيئية داخل الشبكة
function EnvCell({ icon, label, value, sub, real, plain }) {
  const C = useColors();
  return (
    <div style={{
      background: C.L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${C.L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '10px', padding: '0.55rem 0.7rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: C.textMuted, marginBottom: '3px' }}>
        {icon} {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.text }}>{value}</span>
        {!plain && <SourceBadge real={real} />}
      </div>
      {sub && <div style={{ fontSize: '0.66rem', color: C.textFaint, marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}
