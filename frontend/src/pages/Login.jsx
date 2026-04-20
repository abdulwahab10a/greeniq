import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const C = useColors();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const userId = form.userId.trim();
    const password = form.password;

    if (userId.length < 3) return setError('المعرف يجب أن يكون 3 أحرف على الأقل');
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        userId: userId.toLowerCase(),
        password,
      });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'fixed', top: '12%', left: '18%', width: '420px', height: '420px',
        background: 'radial-gradient(circle, rgba(113,131,85,0.1) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '18%', right: '12%', width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(135,152,106,0.07) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card auth-card"
        style={{ borderRadius: '24px', width: '100%', maxWidth: '420px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <motion.div className="float-icon" style={{ fontSize: '3rem', display: 'inline-block', marginBottom: '0.85rem' }}>
            🌿
          </motion.div>
          <h1 key={String(C.L)} style={{
            fontSize: '1.7rem', fontWeight: '800', margin: '0 0 0.4rem',
            background: C.headingGrad,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'inline-block',
          }}>
            تسجيل الدخول
          </h1>
          <p style={{ color: C.textMuted, fontSize: '0.9rem', margin: 0 }}>
            أهلاً بك في <span dir="ltr" style={{ unicodeBidi: 'embed' }}>GreenIQ</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)',
              borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
              color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <AlertCircle size={15} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* UserID */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{
              display: 'block', marginBottom: '0.5rem',
              fontWeight: '600', color: C.textMuted, fontSize: '0.85rem',
            }}>
              معرف المستخدم
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(144,169,85,0.5)', display: 'flex',
              }}>
                <User size={16} />
              </div>
              <input
                type="text" name="userId" value={form.userId}
                onChange={handleChange} placeholder="أدخل معرفك" required
                className="glass-input"
                style={{
                  width: '100%', padding: '0.82rem 1rem 0.82rem 2.75rem',
                  borderRadius: '12px', fontSize: '0.95rem',
                  boxSizing: 'border-box', direction: 'ltr',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.85rem' }}>
            <label style={{
              display: 'block', marginBottom: '0.5rem',
              fontWeight: '600', color: C.textMuted, fontSize: '0.85rem',
            }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(144,169,85,0.5)', display: 'flex',
              }}>
                <Lock size={16} />
              </div>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="أدخل كلمة المرور" required
                className="glass-input"
                style={{
                  width: '100%', padding: '0.82rem 1rem 0.82rem 2.75rem',
                  borderRadius: '12px', fontSize: '0.95rem', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <motion.button
            type="submit" disabled={loading}
            whileHover={!loading ? { y: -2 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="btn-primary"
            style={{
              width: '100%', padding: '0.92rem', fontSize: '1rem',
              fontWeight: '700', borderRadius: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={18} />
                </motion.div>
                جاري تسجيل الدخول...
              </>
            ) : 'تسجيل الدخول'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.35rem', color: C.textSubtle, fontSize: '0.88rem' }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" style={{ color: '#87986a', fontWeight: '700', textDecoration: 'none' }}>
            إنشاء حساب
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
