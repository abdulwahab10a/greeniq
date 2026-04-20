import { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Loader2, CheckCircle2, MapPin, X, Wind, Leaf, Clock } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useColors } from '../context/ThemeContext';

const PROVINCES = [
  { name: 'بغداد', lat: 33.3152, lng: 44.3661 },
  { name: 'البصرة', lat: 30.5085, lng: 47.7804 },
  { name: 'نينوى', lat: 36.3566, lng: 43.1584 },
  { name: 'أربيل', lat: 36.1912, lng: 44.0092 },
  { name: 'النجف', lat: 31.9971, lng: 44.3318 },
  { name: 'كربلاء', lat: 32.6160, lng: 44.0249 },
  { name: 'السليمانية', lat: 35.5571, lng: 45.4367 },
  { name: 'دهوك', lat: 36.8669, lng: 42.9503 },
  { name: 'الأنبار', lat: 33.4258, lng: 43.3000 },
  { name: 'ديالى', lat: 33.7732, lng: 44.6880 },
  { name: 'كركوك', lat: 35.4681, lng: 44.3922 },
  { name: 'واسط', lat: 32.4926, lng: 45.8268 },
  { name: 'بابل', lat: 32.4740, lng: 44.4220 },
  { name: 'ميسان', lat: 31.8290, lng: 47.1504 },
  { name: 'ذي قار', lat: 31.0603, lng: 46.2754 },
  { name: 'المثنى', lat: 29.3685, lng: 45.2899 },
  { name: 'القادسية', lat: 32.0449, lng: 44.9259 },
  { name: 'صلاح الدين', lat: 34.5338, lng: 43.4759 },
];

function nearestProvince(lat, lng) {
  let best = PROVINCES[0], bestDist = Infinity;
  for (const p of PROVINCES) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best.name;
}

function treeAge(createdAt) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  if (days < 1)   return 'أقل من يوم';
  if (days < 30)  return `${days} يوم`;
  if (days < 365) return `${Math.floor(days / 30)} شهر`;
  const yrs = Math.floor(days / 365);
  const rem = Math.floor((days % 365) / 30);
  return rem > 0 ? `${yrs} سنة و${rem} شهر` : `${yrs} سنة`;
}

export default function MapPage() {
  const [selectedTree, setSelectedTree] = useState(null);
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [plantData, setPlantData] = useState({ name: '', notes: '', latitude: '', longitude: '', image: null, ageAtPlanting: '' });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (!showPlantForm) return;
    setLocating(true);
    setLocError('');
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setPlantData(d => ({ ...d, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocError('تعذّر تحديد موقعك، يرجى السماح بالوصول إلى الموقع');
        setLocating(false);
      }
    );
  }, [showPlantForm]);

  const handlePlantSubmit = async (e) => {
    e.preventDefault();
    if (!plantData.latitude || !plantData.longitude) { setLocError('لم يتم تحديد موقعك بعد'); return; }
    if (plantData.name.length > 100) { setLocError('اسم الشجرة يجب ألا يتجاوز 100 حرف'); return; }
    if (plantData.notes.length > 500) { setLocError('الملاحظات يجب ألا تتجاوز 500 حرف'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', plantData.name);
      formData.append('notes', plantData.notes);
      formData.append('latitude', plantData.latitude);
      formData.append('longitude', plantData.longitude);
      if (plantData.image) formData.append('image', plantData.image);
      if (plantData.ageAtPlanting) formData.append('ageAtPlanting', plantData.ageAtPlanting);
      await api.post('/trees', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const prov = nearestProvince(plantData.latitude, plantData.longitude);
      setShowPlantForm(false);
      setPlantData({ name: '', notes: '', latitude: '', longitude: '', image: null, ageAtPlanting: '' });
      setRefreshKey(k => k + 1);
      setSuccessMsg(prov);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setLocError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const C = useColors();
  /* shared style tokens */
  const palmBorder  = '1px solid rgba(135,152,106,0.25)';
  const palmBg      = 'rgba(135,152,106,0.08)';
  const paleText    = C.textMuted;

  return (
    <div className="space-y-4">

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '1rem 1.25rem', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(20,50,15,0.95), rgba(30,70,20,0.95))',
              border: '1px solid rgba(74,222,128,0.4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
              style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}
            >
              🌳
            </motion.div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '800', fontSize: '1rem', color: '#4ade80', margin: '0 0 3px' }}>
                أحسنت! زرعت شجرتك في {successMsg} 🎉
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(134,239,172,0.6)', margin: 0 }}>
                تم إضافة شجرتك على الخارطة — استمر في المساهمة!
              </p>
            </div>
            <button onClick={() => setSuccessMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(134,239,172,0.4)', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 style={{
          fontSize: '1.5rem', fontWeight: '800', margin: 0,
          background: C.headingGrad,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <MapPin size={22} color="#87986a" style={{ WebkitTextFillColor: 'unset' }} />
          خريطة الأشجار
        </h1>
        <motion.button
          onClick={() => { setShowPlantForm(!showPlantForm); setLocError(''); }}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          className="btn-primary"
          style={{
            padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}
        >
          {showPlantForm ? <><X size={14} /> إلغاء</> : <><TreePine size={14} /> غرس شجرة جديدة</>}
        </motion.button>
      </div>

      {/* Plant form */}
      <AnimatePresence>
        {showPlantForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card"
            style={{ borderRadius: '20px', padding: '1.5rem' }}
          >
            <h3 style={{
              fontWeight: '700', fontSize: '1rem', margin: '0 0 1.1rem',
              color: C.heading, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <MapPin size={16} color="#87986a" /> أدخل بيانات الشجرة
            </h3>

            {locating && (
              <div style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: paleText }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={14} color="#87986a" />
                </motion.div>
                جاري تحديد موقعك...
              </div>
            )}
            {!locating && plantData.latitude && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.85rem', color: '#87986a',
                  background: palmBg, border: palmBorder,
                  padding: '0.6rem 0.85rem', borderRadius: '10px',
                }}
              >
                <MapPin size={13} color="#87986a" /> تم تحديد موقعك: {Number(plantData.latitude).toFixed(4)}، {Number(plantData.longitude).toFixed(4)}
              </motion.div>
            )}
            {locError && (
              <div style={{
                marginBottom: '0.85rem', fontSize: '0.85rem', color: '#fca5a5',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                padding: '0.6rem 0.85rem', borderRadius: '10px',
              }}>
                {locError}
              </div>
            )}

            <form onSubmit={handlePlantSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="اسم الشجرة (اختياري)"
                  value={plantData.name} onChange={e => setPlantData({ ...plantData, name: e.target.value })}
                  className="glass-input"
                  style={{ padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
                />
                <input type="file" accept="image/*"
                  onChange={e => setPlantData({ ...plantData, image: e.target.files[0] })}
                  className="glass-input"
                  style={{ padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" max="200" step="0.5"
                  placeholder="ادخل العمر التقريبي للشجرة حاليا (بالسنوات)"
                  value={plantData.ageAtPlanting}
                  onChange={e => setPlantData({ ...plantData, ageAtPlanting: e.target.value })}
                  className="glass-input"
                  style={{ padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
                />
                {plantData.ageAtPlanting > 0 && (
                  <span style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.72rem', color: '#90a955', fontWeight: '600',
                    background: 'rgba(144,169,85,0.12)', border: '1px solid rgba(144,169,85,0.25)',
                    borderRadius: '99px', padding: '1px 8px', pointerEvents: 'none',
                  }}>
                    ≈ {Math.round(plantData.ageAtPlanting * 365)} يوم
                  </span>
                )}
              </div>
              <textarea placeholder="ملاحظات (اختياري)"
                value={plantData.notes} onChange={e => setPlantData({ ...plantData, notes: e.target.value })}
                rows={3} className="glass-input"
                style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <motion.button type="submit"
                disabled={loading || locating || !plantData.latitude}
                whileHover={(!loading && !locating && plantData.latitude) ? { y: -2 } : {}}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: (loading || locating || !plantData.latitude) ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={15} />
                    </motion.div>
                    جاري الغرس...
                  </>
                ) : <><TreePine size={15} /> تأكيد الغرس</>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileUserId && (
          <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
        )}
      </AnimatePresence>

      {/* Map + tree panel */}
      <div style={{ position: 'relative' }}>
        <MapComponent
          onTreeSelect={setSelectedTree}
          onViewProfile={setProfileUserId}
          selectedTreeId={selectedTree?._id}
          refreshKey={refreshKey}
        />

        <AnimatePresence>
          {selectedTree && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
                maxWidth: '340px', marginLeft: 'auto',
                borderRadius: '20px', zIndex: 1000,
                background: C.modalBg,
                border: '1px solid rgba(135,152,106,0.35)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                direction: 'rtl',
              }}
            >
              {/* زر الإغلاق */}
              <button onClick={() => setSelectedTree(null)} style={{
                position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(75,85,99,0.5)',
                cursor: 'pointer', color: '#9ca3af', borderRadius: '8px', padding: '4px',
                display: 'flex', alignItems: 'center',
              }}>
                <X size={15} />
              </button>

              {/* صورة الشجرة */}
              {selectedTree.image && (
                <div style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '1px solid rgba(135,152,106,0.2)',
                }}>
                  <img
                    src={selectedTree.image}
                    alt={selectedTree.name || 'شجرة'}
                    style={{
                      width: '100%',
                      maxHeight: '220px',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              {/* محتوى الكارت */}
              <div style={{ padding: '1rem 1.1rem' }}>
                {/* اسم الشجرة */}
                <h4 style={{
                  fontWeight: '800', fontSize: '1.05rem', margin: '0 0 0.35rem',
                  color: C.modalText, display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <TreePine size={17} color="#4ade80" />
                  {selectedTree.name || 'شجرة'}
                </h4>

                {/* زُرعت بواسطة */}
                <p style={{ fontSize: '0.78rem', color: C.modalMuted, margin: '0 0 0.5rem' }}>
                  زُرعت بواسطة:{' '}
                  <span style={{ fontWeight: '700', color: '#4ade80' }}>
                    {selectedTree.userId?.displayName || 'مستخدم'}
                  </span>
                </p>

                {/* عمر الشجرة */}
                {selectedTree.createdAt && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(144,169,85,0.1)', border: '1px solid rgba(144,169,85,0.25)',
                    borderRadius: '99px', padding: '2px 10px', marginBottom: '0.7rem',
                    fontSize: '0.75rem', color: '#90a955', fontWeight: '600',
                  }}>
                    <Clock size={11} />
                    عمر الشجرة: {treeAge(selectedTree.createdAt)}
                  </div>
                )}

                {/* الملاحظات */}
                {selectedTree.notes && (
                  <p style={{
                    fontSize: '0.82rem', color: C.modalText,
                    margin: '0 0 0.8rem', lineHeight: '1.5',
                    background: C.L ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '8px', padding: '0.5rem 0.75rem',
                  }}>
                    {selectedTree.notes}
                  </p>
                )}

                {/* CO₂ و O₂ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <div style={{
                    background: 'rgba(20,83,45,0.6)', border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: '10px', padding: '0.45rem 0.85rem', fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', gap: '7px', color: '#86efac',
                  }}>
                    <Leaf size={13} />
                    <span>CO₂ المختزل: <strong>{selectedTree.co2Absorbed} كجم</strong></span>
                  </div>
                  <div style={{
                    background: 'rgba(30,58,95,0.6)', border: '1px solid rgba(147,197,253,0.2)',
                    borderRadius: '10px', padding: '0.45rem 0.85rem', fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', gap: '7px', color: '#93c5fd',
                  }}>
                    <Wind size={13} />
                    <span>O₂ المنبعث: <strong>{selectedTree.o2Produced} كجم</strong></span>
                  </div>
                </div>

                {/* زر الملف الشخصي */}
                {selectedTree.userId?._id && (
                  <button
                    onClick={() => { setProfileUserId(selectedTree.userId._id); setSelectedTree(null); }}
                    style={{
                      width: '100%',
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.3)',
                      borderRadius: '10px', padding: '0.6rem 1rem',
                      color: '#4ade80', fontSize: '0.85rem', fontWeight: '700',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                    }}
                  >
                    👤 عرض الملف الشخصي
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
