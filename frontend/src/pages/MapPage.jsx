import { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Loader2, CheckCircle2, MapPin, X, Wind, Leaf } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';

export default function MapPage() {
  const [selectedTree, setSelectedTree] = useState(null);
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [plantData, setPlantData] = useState({ name: '', notes: '', latitude: '', longitude: '', image: null });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
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
      await api.post('/trees', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowPlantForm(false);
      setPlantData({ name: '', notes: '', latitude: '', longitude: '', image: null });
      setRefreshKey(k => k + 1);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      setLocError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  /* shared style tokens */
  const palmBorder  = '1px solid rgba(135,152,106,0.25)';
  const palmBg      = 'rgba(135,152,106,0.08)';
  const paleText    = 'rgba(207,225,185,0.5)';

  return (
    <div className="space-y-4">

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '1rem 1.25rem', borderRadius: '16px',
              borderColor: 'rgba(135,152,106,0.35)',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(144,169,85,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle2 size={20} color="#87986a" />
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '0.93rem', color: '#87986a', margin: 0 }}>تمت عملية الزراعة بنجاح</p>
              <p style={{ fontSize: '0.78rem', color: paleText, margin: '2px 0 0' }}>تم إضافة شجرتك على الخارطة</p>
            </div>
            <button onClick={() => setSuccessMsg(false)}
              style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: paleText }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 style={{
          fontSize: '1.5rem', fontWeight: '800', margin: 0,
          background: 'linear-gradient(135deg, #87986a, #e9f5db)',
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
              color: '#dde8c4', display: 'flex', alignItems: 'center', gap: '8px',
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
                background: '#111827',
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
                  color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <TreePine size={17} color="#4ade80" />
                  {selectedTree.name || 'شجرة'}
                </h4>

                {/* زُرعت بواسطة */}
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 0.7rem' }}>
                  زُرعت بواسطة:{' '}
                  <span style={{ fontWeight: '700', color: '#4ade80' }}>
                    {selectedTree.userId?.displayName || 'مستخدم'}
                  </span>
                </p>

                {/* الملاحظات */}
                {selectedTree.notes && (
                  <p style={{
                    fontSize: '0.82rem', color: '#d1d5db',
                    margin: '0 0 0.8rem', lineHeight: '1.5',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
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
