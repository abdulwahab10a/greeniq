import { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, TreePine, Leaf, Wind, X, Users, ChevronLeft } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';

const RANK_STYLES = [
  { bg: 'rgba(233,245,219,0.07)', border: 'rgba(233,245,219,0.22)', accent: '#e9f5db', medal: '🥇' },
  { bg: 'rgba(135,152,106,0.09)', border: 'rgba(135,152,106,0.24)', accent: '#87986a', medal: '🥈' },
  { bg: 'rgba(113,131,85,0.1)',   border: 'rgba(113,131,85,0.26)',  accent: '#718355', medal: '🥉' },
];
const DEFAULT_STYLE = { bg: 'rgba(74,94,51,0.18)', border: 'rgba(135,152,106,0.12)', accent: '#87986a' };

const CONTRIBUTOR_MEDALS = ['🥇', '🥈', '🥉'];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '84px', borderRadius: '16px' }} />
      ))}
    </div>
  );
}

function GovContributorsModal({ gov, onClose }) {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    api.get(`/trees/governorates/${encodeURIComponent(gov.name)}/top`)
      .then(res => setContributors(res.data))
      .finally(() => setLoading(false));
  }, [gov.name]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(8,14,5,0.78)',
          backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2000, padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background: '#111827', border: '1px solid rgba(75,85,99,0.55)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            borderRadius: '24px', width: '100%', maxWidth: '400px',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1f0a 0%, #1a3010 50%, #243d16 100%)',
            borderBottom: '1px solid rgba(75,85,99,0.4)',
            padding: '1.5rem 1.75rem', position: 'relative',
          }}>
            <button onClick={onClose} style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
              borderRadius: '8px', cursor: 'pointer', color: '#9ca3af',
              padding: '5px', display: 'flex', alignItems: 'center',
            }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Building2 size={20} color="#4ade80" />
              </div>
              <div>
                <h2 style={{ color: '#f9fafb', fontSize: '1.1rem', fontWeight: '800', margin: '0 0 2px' }}>
                  {gov.name}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={11} /> أفضل 3 مساهمين في تحسين جو المحافظة
                </p>
              </div>
            </div>

            {/* Gov stats */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '1rem', flexWrap: 'wrap' }}>
              {[
                { icon: TreePine, label: `${gov.treesCount} شجرة`, color: '#4ade80', bg: '#14532d' },
                { icon: Leaf,     label: `CO₂: ${gov.totalCO2} كجم`, color: '#86efac', bg: '#14532d' },
                { icon: Wind,     label: `O₂: ${gov.totalO2} كجم`,   color: '#93c5fd', bg: '#1e3a5f' },
              ].map(({ icon: Icon, label, color, bg }) => (
                <span key={label} style={{
                  fontSize: '0.72rem', padding: '3px 9px', borderRadius: '20px',
                  background: bg, color, border: `1px solid ${color}22`,
                  display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600',
                }}>
                  <Icon size={10} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Contributors list */}
          <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '14px' }} />
                ))}
              </div>
            ) : contributors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: '0.9rem' }}>
                لا يوجد بيانات بعد لهذه المحافظة 🌱
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contributors.map((user, i) => (
                  <motion.button
                    key={user._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedUserId(user._id)}
                    style={{
                      width: '100%', textAlign: 'right',
                      background: '#1f2937', border: '1px solid rgba(75,85,99,0.4)',
                      borderRadius: '14px', padding: '0.85rem 1rem',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {/* Medal */}
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                      {CONTRIBUTOR_MEDALS[i]}
                    </span>

                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(74,94,51,0.6), rgba(113,131,85,0.4))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(74,222,128,0.25)', overflow: 'hidden',
                      fontSize: '1rem', fontWeight: '800', color: '#e9f5db',
                    }}>
                      {user.profileImage
                        ? <img src={user.profileImage} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : user.displayName?.[0]?.toUpperCase()
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#f9fafb', fontWeight: '700', fontSize: '0.9rem', margin: '0 0 3px' }}>
                        {user.displayName}
                      </p>
                      <span style={{
                        fontSize: '0.72rem', color: '#4ade80',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <TreePine size={10} /> {user.count} شجرة في هذه المحافظة
                      </span>
                    </div>

                    <ChevronLeft size={16} color="#4b5563" style={{ flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#374151', marginTop: '1rem', marginBottom: 0 }}>
              اضغط على اسم أي شخص لعرض ملفه الشخصي
            </p>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedUserId && (
          <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default function GovernoratesPage() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selectedGov, setSelectedGov] = useState(null);

  useEffect(() => {
    api.get('/trees/governorates')
      .then(res => setData(res.data))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: '42px', width: '220px', borderRadius: '12px', margin: '0 auto 10px' }} />
        <div className="skeleton" style={{ height: '20px', width: '300px', borderRadius: '8px', margin: '0 auto' }} />
      </div>
      <LoadingSkeleton />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#fca5a5', fontSize: '0.95rem' }}>
      {error}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <AnimatePresence>
        {selectedGov && (
          <GovContributorsModal gov={selectedGov} onClose={() => setSelectedGov(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        <h1 style={{
          fontSize: '1.9rem', fontWeight: '800', margin: '0 0 0.4rem',
          background: 'linear-gradient(135deg, #87986a, #e9f5db)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          <Building2 size={26} color="#90a955" style={{ WebkitTextFillColor: 'unset' }} />
          أفضل المحافظات
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(207,225,185,0.4)', margin: 0 }}>
          اضغط على أي محافظة لعرض أفضل المساهمين فيها
        </p>
      </motion.div>

      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(221,232,196,0.3)' }}>
          لا توجد بيانات بعد — كن أول من يزرع! 🌱
        </div>
      )}

      <div className="space-y-2">
        {data.map((gov, index) => {
          const s    = RANK_STYLES[index] ?? DEFAULT_STYLE;
          const rank = index + 1;

          return (
            <motion.div
              key={gov.name}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.055, 0.55), duration: 0.35 }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGov(gov)}
              style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: '16px', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '14px',
                backdropFilter: 'blur(12px)', cursor: 'pointer',
              }}
            >
              {/* Rank */}
              <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
                {s.medal
                  ? <span style={{ fontSize: '1.45rem' }}>{s.medal}</span>
                  : (
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto',
                      background: `${s.accent}18`, border: `1px solid ${s.accent}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.accent, fontSize: '0.78rem', fontWeight: '700',
                    }}>
                      {rank}
                    </div>
                  )
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <Building2 size={15} color={s.accent} />
                  <h2 style={{ fontWeight: '700', color: '#cfe1b9', fontSize: '0.97rem', margin: 0 }}>
                    {gov.name}
                  </h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {[
                    { icon: TreePine, label: `${gov.treesCount} شجرة`,    bg: 'rgba(135,152,106,0.12)', border: 'rgba(135,152,106,0.24)', color: '#b5c99a' },
                    { icon: Leaf,     label: `CO₂: ${gov.totalCO2} كجم`, bg: 'rgba(113,131,85,0.14)',  border: 'rgba(113,131,85,0.26)',  color: '#97a97c' },
                    { icon: Wind,     label: `O₂: ${gov.totalO2} كجم`,   bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',   color: '#93c5fd' },
                  ].map(({ icon: Icon, label, bg, border, color }) => (
                    <span key={label} style={{
                      fontSize: '0.72rem', padding: '2px 9px', borderRadius: '20px',
                      background: bg, color, border: `1px solid ${border}`,
                      display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600',
                    }}>
                      <Icon size={10} /> {label}
                    </span>
                  ))}
                </div>
              </div>

              <ChevronLeft size={16} color={`${s.accent}66`} style={{ flexShrink: 0 }} />
            </motion.div>
          );
        })}
      </div>

      {data.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(207,225,185,0.22)', paddingTop: '0.5rem' }}>
          * يتم تصنيف المحافظات بناءً على إحداثيات الأشجار المزروعة
        </p>
      )}
    </div>
  );
}
