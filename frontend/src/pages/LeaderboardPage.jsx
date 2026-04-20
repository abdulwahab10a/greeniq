import { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TreePine, Leaf, Wind } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useColors } from '../context/ThemeContext';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/* Rank-specific accent colors using the new palette */
const RANK_STYLES = {
  1: { bg: 'rgba(233,245,219,0.07)', border: 'rgba(233,245,219,0.22)', accent: '#e9f5db' },
  2: { bg: 'rgba(135,152,106,0.09)', border: 'rgba(135,152,106,0.24)', accent: '#87986a' },
  3: { bg: 'rgba(113,131,85,0.1)',   border: 'rgba(113,131,85,0.26)',  accent: '#718355' },
};
const DEFAULT_STYLE = { bg: 'rgba(74,94,51,0.18)', border: 'rgba(135,152,106,0.12)', accent: '#87986a' };

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '16px' }} />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const C = useColors();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: '42px', width: '200px', borderRadius: '12px', margin: '0 auto 10px' }} />
        <div className="skeleton" style={{ height: '20px', width: '260px', borderRadius: '8px', margin: '0 auto' }} />
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
        {selectedUserId && (
          <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        <h1 style={{
          fontSize: '1.9rem', fontWeight: '800', margin: '0 0 0.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          <Trophy size={26} color="#90a955" />
          <span key={String(C.L)} style={{
            background: C.headingGrad, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block',
          }}>أفضل الزارعين</span>
        </h1>
        <p style={{ fontSize: '0.85rem', color: C.textSubtle, margin: 0 }}>
          أفضل 100 مستخدم حسب عدد الأشجار المزروعة
        </p>
      </motion.div>

      {leaders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: C.textFaint }}>
          لا يوجد زارعون بعد، كن الأول! 🌱
        </div>
      )}

      <div className="space-y-2">
        {leaders.map((user, index) => {
          const rank  = index + 1;
          const isTop = rank <= 3;
          const s     = RANK_STYLES[rank] ?? DEFAULT_STYLE;

          return (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.6), duration: 0.35 }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              onClick={() => setSelectedUserId(user._id)}
              style={{
                background: C.L ? 'rgba(235,245,222,0.75)' : s.bg,
                border: `1px solid ${C.L ? 'rgba(113,131,85,0.25)' : s.border}`,
                borderRadius: '16px', padding: '0.85rem 1.1rem',
                display: 'flex', alignItems: 'center', gap: '14px',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
              }}
            >
              {/* Rank badge */}
              <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                {isTop
                  ? <span style={{ fontSize: '1.45rem' }}>{MEDAL[rank]}</span>
                  : <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: `${s.accent}18`, border: `1px solid ${s.accent}44`,
                      color: s.accent, fontSize: '0.75rem', fontWeight: '700',
                    }}>
                      {rank}
                    </span>
                }
              </div>

              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.displayName} style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    objectFit: 'cover', border: `2px solid ${s.accent}55`,
                  }} />
                ) : (
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${s.accent}22, ${s.accent}44)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', color: s.accent, fontSize: '1.1rem',
                    border: `2px solid ${s.accent}44`,
                  }}>
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', color: C.text, margin: '0 0 5px', fontSize: '0.93rem' }}>
                  {user.displayName}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {[
                    { icon: TreePine, label: `${user.treesCount} شجرة`,    bg: 'rgba(135,152,106,0.12)', border: 'rgba(135,152,106,0.24)', color: '#b5c99a' },
                    { icon: Leaf,     label: `CO₂: ${user.totalCO2} كجم`, bg: 'rgba(113,131,85,0.14)',  border: 'rgba(113,131,85,0.26)',  color: '#97a97c' },
                    { icon: Wind,     label: `O₂: ${user.totalO2} كجم`,   bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',   color: '#93c5fd' },
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
