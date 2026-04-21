import { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, AtSign, Link2, Camera, AlertCircle, Loader2, X } from 'lucide-react';

export default function Register() {
  const { login } = useContext(AuthContext);
  const C = useColors();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    userId: '', displayName: '', password: '', confirmPassword: '', socialLink: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fieldError, setFieldError] = useState({ field: '', message: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (fieldError.field === name) setFieldError({ field: '', message: '' });
    setForm(prev => ({ ...prev, [name]: value }));
  };

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

  const setErr = (field, message) => {
    setFieldError({ field, message });
    setForm(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError({ field: '', message: '' });
    setApiError('');

    const userId = form.userId.trim();
    const displayName = form.displayName.trim();
    const socialLink = form.socialLink.trim();

    if (userId.length < 3 || userId.length > 20) return setErr('userId', 'المعرف يجب أن يكون بين 3 و 20 حرفاً');
    if (!/^[a-zA-Z0-9_.]+$/.test(userId)) return setErr('userId', 'المعرف يجب أن يحتوي على أحرف إنجليزية وأرقام و _ و . فقط');
    if (displayName.length < 2 || displayName.length > 30) return setErr('displayName', 'الاسم الظاهر يجب أن يكون بين 2 و 30 حرفاً');
    if (form.password.length < 8) return setErr('password', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (form.password !== form.confirmPassword) return setErr('confirmPassword', 'كلمتا المرور غير متطابقتين');
    if (socialLink && !/^https?:\/\/.+\..+/.test(socialLink)) return setErr('socialLink', 'رابط التواصل الاجتماعي يجب أن يبدأ بـ https://');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId.toLowerCase());
      formData.append('displayName', displayName);
      formData.append('password', form.password);
      if (socialLink) formData.append('instagramLink', socialLink);
      if (profileImage) formData.append('profileImage', profileImage);

      const { data } = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(data);
      navigate('/map');
    } catch (err) {
      setApiError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const textFields = [
    { name: 'userId',          label: 'معرف المستخدم (UserID)', placeholder: 'مثال: ahmed_ali',         type: 'text',     icon: AtSign, hint: 'أحرف إنجليزية وأرقام و _ و . فقط', dir: 'ltr' },
    { name: 'displayName',     label: 'الاسم الظاهر',            placeholder: 'مثال: أحمد علي',           type: 'text',     icon: User   },
    { name: 'password',        label: 'كلمة المرور',              placeholder: '8 أحرف على الأقل',        type: 'password', icon: Lock   },
    { name: 'confirmPassword', label: 'تأكيد كلمة المرور',        placeholder: 'أعد كتابة كلمة المرور',   type: 'password', icon: Lock   },
  ];

  const inputIconStyle = {
    position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(144,169,85,0.5)', display: 'flex',
  };

  const InlineError = ({ field }) => (
    <AnimatePresence>
      {fieldError.field === field && (
        <motion.div
          key="inline-err"
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '10px',
            padding: '0.55rem 0.85rem',
            marginTop: '0.45rem',
            color: '#fca5a5',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {fieldError.message}
        </motion.div>
      )}
    </AnimatePresence>
  );

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
          <h1 key={String(C.L)} style={{
            fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.4rem',
            background: C.headingGrad,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'inline-block',
          }}>
            إنشاء حساب جديد
          </h1>
          <p style={{ color: C.textSubtle, fontSize: '0.88rem', margin: 0 }}>
            انضم إلى مجتمع GreenIQ
          </p>
        </div>

        {/* API / server error banner */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              key="api-err"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)',
                borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
                color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <AlertCircle size={15} /> {apiError}
            </motion.div>
          )}
        </AnimatePresence>

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
              <span style={{ fontSize: '0.78rem', color: C.textSubtle }}>
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

          {textFields.map(({ name, label, placeholder, type, icon: Icon, hint, dir }, i) => {
            const hasErr = fieldError.field === name;
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 1) * 0.05, duration: 0.35 }}
                style={{ marginBottom: '1rem' }}
              >
                <label style={{
                  display: 'block', marginBottom: '0.45rem',
                  fontWeight: '600', color: C.textMuted, fontSize: '0.85rem',
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
                      boxSizing: 'border-box',
                      ...(dir ? { direction: dir } : {}),
                      ...(hasErr ? { borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 0 0 2px rgba(239,68,68,0.15)' } : {}),
                    }}
                  />
                </div>
                {hint && !hasErr && <p style={{ fontSize: '0.73rem', color: C.textFaint, marginTop: '0.3rem' }}>{hint}</p>}
                <InlineError field={name} />
              </motion.div>
            );
          })}

          {/* Social link */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            style={{ marginBottom: '1.85rem' }}
          >
            <label style={{
              display: 'block', marginBottom: '0.45rem',
              fontWeight: '600', color: C.textMuted, fontSize: '0.85rem',
            }}>
              رابط التواصل الاجتماعي{' '}
              <span style={{ color: C.textFaint, fontWeight: '400' }}>(اختياري)</span>
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
                  ...(fieldError.field === 'socialLink' ? { borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 0 0 2px rgba(239,68,68,0.15)' } : {}),
                }}
              />
            </div>
            {fieldError.field !== 'socialLink' && (
              <p style={{ fontSize: '0.72rem', color: C.textFaint, marginTop: '0.3rem' }}>
                Instagram · Facebook · Snapchat · Telegram · X
              </p>
            )}
            <InlineError field="socialLink" />
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

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: C.textSubtle, fontSize: '0.88rem' }}>
          لديك حساب؟{' '}
          <Link to="/login" style={{ color: '#87986a', fontWeight: '700', textDecoration: 'none' }}>سجّل دخول</Link>
        </p>
      </motion.div>
    </div>
  );
}
