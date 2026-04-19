import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, TreePine, UserCheck, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const C = {
  palmLeaf:    '#87986a',
  frostedMint: '#e9f5db',
  teaGreen:    '#cfe1b9',
  dustyOlive:  '#718355',
  hunter:      '#4a5e33',
  bg:          'rgba(10,18,7,0.6)',
  card:        'rgba(15,25,10,0.7)',
  border:      'rgba(135,152,106,0.18)',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        padding: '1.4rem 1.6rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        flex: '1 1 160px',
      }}
    >
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px',
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, color: 'rgba(207,225,185,0.5)', fontSize: '0.78rem' }}>{label}</p>
        <p style={{ margin: 0, color: C.frostedMint, fontSize: '1.55rem', fontWeight: '800', lineHeight: 1.2 }}>{value ?? '—'}</p>
      </div>
    </motion.div>
  );
}

function Avatar({ user }) {
  if (user.profileImage) {
    return (
      <img src={user.profileImage} alt={user.displayName} style={{
        width: '38px', height: '38px', borderRadius: '50%',
        objectFit: 'cover', border: `2px solid rgba(135,152,106,0.4)`, flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '700', color: C.frostedMint, fontSize: '0.88rem',
      border: `2px solid rgba(135,152,106,0.35)`,
    }}>
      {user.displayName?.[0]?.toUpperCase()}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async (q, p) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search: q, page: p, limit: 20 } });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(query, page); }, [query, page, fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('ar-IQ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 0.5rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.8rem' }}>
        <h1 style={{
          margin: 0, fontSize: '1.6rem', fontWeight: '800',
          background: `linear-gradient(135deg, ${C.palmLeaf}, ${C.frostedMint})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          لوحة التحكم
        </h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(207,225,185,0.45)', fontSize: '0.85rem' }}>
          إدارة حسابات المستخدمين
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard icon={Users}       label="إجمالي المستخدمين" value={stats?.total}      color={C.palmLeaf}   />
        <StatCard icon={UserCheck}   label="مسجلون اليوم"      value={stats?.todayCount} color="#60a5fa"      />
        <StatCard icon={CalendarDays} label="خلال 7 أيام"      value={stats?.weekCount}  color="#a78bfa"      />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="rgba(135,152,106,0.55)" style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المستخدم أو المعرف..."
            style={{
              width: '100%', padding: '0.7rem 2.6rem 0.7rem 1rem',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '12px', color: C.frostedMint, fontSize: '0.9rem',
              outline: 'none', boxSizing: 'border-box', direction: 'rtl',
            }}
          />
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            padding: '0.7rem 1.4rem', borderRadius: '12px',
            background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
            border: 'none', color: C.frostedMint, fontWeight: '700',
            fontSize: '0.88rem', cursor: 'pointer',
          }}
        >
          بحث
        </motion.button>
      </form>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: '16px', overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.4fr',
          padding: '0.85rem 1.4rem',
          borderBottom: `1px solid ${C.border}`,
          color: 'rgba(207,225,185,0.45)', fontSize: '0.78rem', fontWeight: '600',
        }}>
          <span>المستخدم</span>
          <span style={{ textAlign: 'center' }}>المعرف</span>
          <span style={{ textAlign: 'center' }}>الأشجار</span>
          <span style={{ textAlign: 'center' }}>تاريخ التسجيل</span>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '3px solid rgba(79,119,45,0.2)',
                  borderTopColor: C.palmLeaf, margin: '0 auto',
                }}
              />
            </div>
          ) : users.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(207,225,185,0.35)' }}>
              لا يوجد نتائج
            </p>
          ) : (
            <motion.div key={`${query}-${page}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {users.map((u, i) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.4fr',
                    padding: '0.9rem 1.4rem', alignItems: 'center',
                    borderBottom: i < users.length - 1 ? `1px solid rgba(135,152,106,0.08)` : 'none',
                  }}
                >
                  {/* Name + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar user={u} />
                    <span style={{ color: C.teaGreen, fontWeight: '600', fontSize: '0.9rem' }}>
                      {u.displayName}
                    </span>
                    {u.role === 'admin' && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '700', padding: '2px 7px',
                        borderRadius: '20px', background: 'rgba(250,204,21,0.15)',
                        border: '1px solid rgba(250,204,21,0.4)', color: '#fbbf24',
                      }}>أدمن</span>
                    )}
                  </div>
                  {/* userId */}
                  <span style={{ textAlign: 'center', color: 'rgba(207,225,185,0.55)', fontSize: '0.85rem' }}>
                    @{u.userId}
                  </span>
                  {/* trees */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <TreePine size={14} color={C.palmLeaf} />
                    <span style={{ color: C.frostedMint, fontWeight: '700', fontSize: '0.9rem' }}>
                      {u.treesCount}
                    </span>
                  </div>
                  {/* date */}
                  <span style={{ textAlign: 'center', color: 'rgba(207,225,185,0.45)', fontSize: '0.8rem' }}>
                    {formatDate(u.createdAt)}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
              padding: '8px 14px', color: page === 1 ? 'rgba(207,225,185,0.2)' : C.teaGreen,
              cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </motion.button>
          <span style={{ color: 'rgba(207,225,185,0.55)', fontSize: '0.88rem' }}>
            {page} / {pages} — ({total} مستخدم)
          </span>
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            disabled={page === pages}
            onClick={() => setPage(p => p + 1)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
              padding: '8px 14px', color: page === pages ? 'rgba(207,225,185,0.2)' : C.teaGreen,
              cursor: page === pages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
