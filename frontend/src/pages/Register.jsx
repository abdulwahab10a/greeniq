import { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { User, Lock, AtSign, Link2, Camera, AlertCircle, Loader2, X } from 'lucide-react';

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    userId: '', displayName: '', password: '', confirmPassword: '', socialLink: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('كلمتا المرور غير متطابقتين');
    if (form.userId.length < 3) return setError('المعرف يجب أن يكون 3 أحرف على الأقل');
    if (!/^[a-zA-Z0-9_]+$/.test(form.userId)) return setError('المعرف يجب أن يحتوي على أحرف وأرقام فقط');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', form.userId.toLowerCase());
      formData.append('displayName', form.displayName);
      formData.append('password', form.password);
      if (form.socialLink) formData.append('instagramLink', form.socialLink);
      if (profileImage) formData.append('profileImage', profileImage);

      const { data } = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(data);
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const textFields = [
    { name: 'userId',          label: 'معرف المستخدم (UserID)', placeholder: 'مثال: ahmed_ali',         type: 'text',     icon: AtSign, hint: 'أحرف إنجليزية وأرقام و _ فقط', dir: 'ltr' },
    { name: 'displayName',     label: 'الاسم الظاهر',            placeholder: 'مثال: أحمد علي',           type: 'text',     icon: User   },
    { name: 'password',        label: 'كلمة المرور',              placeholder: '6 أحرف على الأقل',        type: 'password', icon: Lock   },
    { name: 'confirmPassword', label: 'تأكيد كلمة المرور',        placeholder: 'أعد كتابة كلمة المرور',   type: 'password', icon: Lock   },
  ];

  const inputIconStyle = {
    position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(144,169,85,0.5)', display: 'flex',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', top: '10%', right: '12%', width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(113,131,85,0.09) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '12%', left: '8%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(135,152,106,0.06) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card auth-card"
        style={{ borderRadius: '24px', width: '100%', maxWidth: '460px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div className="float-icon" style={{ fontSize: '3rem', display: 'inline-block', marginBottom: '0.75rem' }}>
            🌱
          </motion.div>
          <h1 style={{
            fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.4rem',
            background: 'linear-gradient(135deg, #87986a, #e9f5db)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            إنشاء حساب جديد
          </h1>
          <p style={{ color: 'rgba(207,225,185,0.45)', fontSize: '0.88rem', margin: 0 }}>
            انضم إلى مجتمع Green Iraq
          </p>
        </div>

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
          {/* Avatar picker */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.35 }}
            style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '88px', height: '88px', borderRadius: '50%', cursor: 'pointer',
                background: imagePreview ? 'transparent' : 'rgba(49,87,44,0.4)',
                border: `2px dashed ${imagePreview ? 'rgba(144,169,85,0.6)' : 'rgba(144,169,85,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative', transition: 'all 0.2s',
              }}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={22} color="rgba(144,169,85,0.5)" />
              }
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <Camera size={18} color="#ecf39e" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(207,225,185,0.4)' }}>
                {imagePreview ? 'تم اختيار الصورة' : 'صورة الملف الشخصي (اختياري)'}
              </span>
              {imagePreview && (
                <button type="button" onClick={removeImage} style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '6px', padding: '2px 6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', color: '#fca5a5',
                }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>

          {textFields.map(({ name, label, placeholder, type, icon: Icon, hint, dir }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.05, duration: 0.35 }}
              style={{ marginBottom: '1rem' }}
            >
              <label style={{
                display: 'block', marginBottom: '0.45rem',
                fontWeight: '600', color: 'rgba(207,225,185,0.65)', fontSize: '0.85rem',
              }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={inputIconStyle}><Icon size={16} /></div>
                <input
                  type={type} name={name} value={form[name]}
                  onChange={handleChange} placeholder={placeholder} required
                  className="glass-input"
                  style={{
                    width: '100%', padding: '0.8rem 1rem 0.8rem 2.75rem',
                    borderRadius: '12px', fontSize: '0.92rem',
                    boxSizing: 'border-box', ...(dir ? { direction: dir } : {}),
                  }}
                />
              </div>
              {hint && <p style={{ fontSize: '0.73rem', color: 'rgba(207,225,185,0.3)', marginTop: '0.3rem' }}>{hint}</p>}
            </motion.div>
          ))}

          {/* Social link */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            style={{ marginBottom: '1.85rem' }}
          >
            <label style={{
              display: 'block', marginBottom: '0.45rem',
              fontWeight: '600', color: 'rgba(207,225,185,0.65)', fontSize: '0.85rem',
            }}>
              رابط التواصل الاجتماعي{' '}
              <span style={{ color: 'rgba(207,225,185,0.3)', fontWeight: '400' }}>(اختياري)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={inputIconStyle}><Link2 size={16} /></div>
              <input
                type="url" name="socialLink" value={form.socialLink}
                onChange={handleChange} placeholder="https://instagram.com/username"
                className="glass-input"
                style={{
                  width: '100%', padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '12px', fontSize: '0.88rem',
                  boxSizing: 'border-box', direction: 'ltr',
                }}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(207,225,185,0.28)', marginTop: '0.3rem' }}>
              Instagram · Facebook · Snapchat · Telegram · X
            </p>
          </motion.div>

          <motion.button
            type="submit" disabled={loading}
            whileHover={!loading ? { y: -2 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="btn-primary"
            style={{
              width: '100%', padding: '0.92rem', fontSize: '1rem', fontWeight: '700',
              borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={18} />
                </motion.div>
                جاري إنشاء الحساب...
              </>
            ) : 'إنشاء الحساب'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(207,225,185,0.4)', fontSize: '0.88rem' }}>
          لديك حساب؟{' '}
          <Link to="/login" style={{ color: '#87986a', fontWeight: '700', textDecoration: 'none' }}>سجّل دخول</Link>
        </p>
      </motion.div>
    </div>
  );
}
