import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, X, CheckCircle2, AlertCircle, Loader2,
  TreePine, AtSign, User, Phone, Link2, Camera, Edit3, ExternalLink, QrCode,
  Leaf, Wind,
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaSnapchatGhost, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Html5QrcodeScanner } from 'html5-qrcode';

/* ── Platform detection ──────────────────────────────────── */
function detectPlatform(url) {
  if (!url) return null;
  if (/instagram\.com/i.test(url))              return { name: 'Instagram', color: '#E1306C', Icon: FaInstagram   };
  if (/facebook\.com|fb\.com/i.test(url))       return { name: 'Facebook',  color: '#1877F2', Icon: FaFacebook    };
  if (/snapchat\.com/i.test(url))               return { name: 'Snapchat',  color: '#FFFC00', textColor: '#1a1a1a', Icon: FaSnapchatGhost };
  if (/t\.me|telegram\.(me|org)/i.test(url))    return { name: 'Telegram',  color: '#26A5E4', Icon: FaTelegram    };
  if (/twitter\.com|x\.com/i.test(url))         return { name: 'X / Twitter', color: '#b5c99a', Icon: FaXTwitter };
  return { name: 'رابط', color: '#87986a', Icon: Link2 };
}

const SOCIAL_FIELDS = [
  { key: 'instagramLink', label: 'Instagram',   placeholder: 'https://instagram.com/username',    Icon: FaInstagram,    color: '#E1306C' },
  { key: 'facebookLink',  label: 'Facebook',    placeholder: 'https://facebook.com/username',     Icon: FaFacebook,     color: '#1877F2' },
  { key: 'snapchatLink',  label: 'Snapchat',    placeholder: 'https://snapchat.com/add/username', Icon: FaSnapchatGhost,color: '#FFFC00' },
  { key: 'telegramLink',  label: 'Telegram',    placeholder: 'https://t.me/username',             Icon: FaTelegram,     color: '#26A5E4' },
  { key: 'twitterLink',   label: 'X / Twitter', placeholder: 'https://x.com/username',            Icon: FaXTwitter,     color: '#b5c99a' },
];

/* ── Shared palette tokens ──────────────────────────────── */
const T = {
  palm:    '#87986a',
  cream:   '#e9f5db',
  text:    '#cfe1b9',
  muted:   'rgba(207,225,185,0.5)',
  subtle:  'rgba(207,225,185,0.28)',
  huntBg:  'rgba(74,94,51,0.38)',
  huntBd:  'rgba(135,152,106,0.22)',
  fernBd:  'rgba(113,131,85,0.3)',
};

/* ── Small helpers ──────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: T.muted, fontSize: '0.8rem' }}>
      {children}
    </label>
  );
}

function IconWrap({ children }) {
  return (
    <div style={{
      position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
      color: 'rgba(135,152,106,0.5)', display: 'flex', alignItems: 'center', zIndex: 1,
    }}>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      style={{
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)',
        borderRadius: '10px', padding: '0.7rem 1rem', marginBottom: '1rem',
        color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      <AlertCircle size={14} /> {msg}
    </motion.div>
  );
}

function SubmitBtn({ loading, children }) {
  return (
    <motion.button
      type="submit" disabled={loading}
      whileHover={!loading ? { y: -2 } : {}}
      whileTap={{ scale: 0.97 }}
      className="btn-primary"
      style={{
        width: '100%', padding: '0.85rem', fontSize: '0.93rem', fontWeight: '700',
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      {loading ? (
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={16} />
          </motion.div>
          جاري الحفظ...
        </>
      ) : children}
    </motion.button>
  );
}

function ModalShell({ children, onClose, title, titleIcon, wide }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(8, 14, 5, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card"
        style={{
          borderRadius: '24px', padding: '2rem',
          width: '100%', maxWidth: wide ? '520px' : '420px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '1.08rem', fontWeight: '700', margin: 0,
            color: T.text, display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {titleIcon} {title}
          </h2>
          <button onClick={onClose} style={{
            background: T.huntBg, border: `1px solid ${T.huntBd}`,
            borderRadius: '8px', cursor: 'pointer', padding: '5px',
            color: T.muted, display: 'flex', alignItems: 'center',
          }}>
            <X size={15} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── QR Scanner Modal ───────────────────────────────────── */
function QRScannerModal({ onClose, onResult }) {
  const scannerId = 'qr-scanner-container';

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
      false
    );
    scanner.render(
      (text) => {
        scanner.clear().catch(() => {});
        onResult(text);
        onClose();
      },
      () => {}
    );
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,14,5,0.85)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 3000, padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card"
        style={{ borderRadius: '24px', padding: '1.5rem', width: '100%', maxWidth: '380px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: T.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={16} color={T.palm} /> امسح رمز QR
          </h2>
          <button onClick={onClose} style={{
            background: T.huntBg, border: `1px solid ${T.huntBd}`,
            borderRadius: '8px', cursor: 'pointer', padding: '5px',
            color: T.muted, display: 'flex', alignItems: 'center',
          }}>
            <X size={15} />
          </button>
        </div>
        <p style={{ color: T.muted, fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>
          وجّه الكاميرا نحو رمز QR الخاص بحسابك
        </p>
        <div
          id={scannerId}
          style={{ borderRadius: '14px', overflow: 'hidden' }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Change Password Modal ──────────────────────────────── */
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) return setError('كلمتا المرور الجديدة غير متطابقتين');
    if (form.newPassword.length < 6) return setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
    setLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  return (
    <ModalShell onClose={onClose} title="تغيير كلمة المرور" titleIcon={<Lock size={16} color={T.palm} />}>
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'rgba(135,152,106,0.1)', border: `1px solid ${T.huntBd}`,
            borderRadius: '16px', padding: '2rem', textAlign: 'center',
          }}
        >
          <CheckCircle2 size={38} color={T.palm} style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: T.palm, fontWeight: '700', margin: 0 }}>تم تغيير كلمة المرور بنجاح</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <ErrorBanner msg={error} />}
          {[
            { key: 'currentPassword',  label: 'كلمة المرور الحالية',        placeholder: 'أدخل كلمة مرورك الحالية' },
            { key: 'newPassword',      label: 'كلمة المرور الجديدة',        placeholder: '6 أحرف على الأقل' },
            { key: 'confirmPassword',  label: 'تأكيد كلمة المرور الجديدة', placeholder: 'أعد كتابة كلمة المرور الجديدة' },
          ].map(({ key, label, placeholder }, i) => (
            <div key={key} style={{ marginBottom: i === 2 ? '1.5rem' : '1rem' }}>
              <FieldLabel>{label}</FieldLabel>
              <input type="password" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} required className="glass-input"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '11px', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <SubmitBtn loading={loading}>حفظ كلمة المرور الجديدة</SubmitBtn>
        </form>
      )}
    </ModalShell>
  );
}

/* ── Edit Profile Modal ─────────────────────────────────── */
function EditProfileModal({ user, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const [qrTarget, setQrTarget] = useState(null); // which field is being scanned
  const [form, setForm] = useState({
    displayName:   user.displayName   || '',
    phone:         user.phone         || '',
    instagramLink: user.instagramLink || '',
    facebookLink:  user.facebookLink  || '',
    snapchatLink:  user.snapchatLink  || '',
    telegramLink:  user.telegramLink  || '',
    twitterLink:   user.twitterLink   || '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user.profileImage || '');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (profileImage) fd.append('profileImage', profileImage);
      const { data } = await api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  return (
    <>
    <AnimatePresence>
      {qrTarget && (
        <QRScannerModal
          onClose={() => setQrTarget(null)}
          onResult={(url) => {
            setForm(f => ({ ...f, [qrTarget]: url }));
            setQrTarget(null);
          }}
        />
      )}
    </AnimatePresence>
    <ModalShell onClose={onClose} title="تعديل الملف الشخصي" titleIcon={<Edit3 size={16} color={T.palm} />} wide>
      <form onSubmit={handleSubmit}>
        {error && <ErrorBanner msg={error} />}

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '88px', height: '88px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '88px', height: '88px', borderRadius: '50%', cursor: 'pointer',
                background: imagePreview ? 'transparent' : T.huntBg,
                border: `2px dashed ${T.palm}66`,
                overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={22} color={`${T.palm}88`} />
              }
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <Camera size={18} color={T.cream} />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Basic info — responsive grid */}
        <div className="grid-2-col">
          <div>
            <FieldLabel>الاسم الظاهر</FieldLabel>
            <div style={{ position: 'relative' }}>
              <IconWrap><User size={14} /></IconWrap>
              <input type="text" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="الاسم الظاهر" required className="glass-input"
                style={{ width: '100%', padding: '0.68rem 0.85rem 0.68rem 2.3rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div>
            <FieldLabel>رقم الهاتف</FieldLabel>
            <div style={{ position: 'relative' }}>
              <IconWrap><Phone size={14} /></IconWrap>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+964..." className="glass-input" dir="ltr"
                style={{ width: '100%', padding: '0.68rem 0.85rem 0.68rem 2.3rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Social links */}
        <div style={{
          background: 'rgba(30,46,20,0.45)', border: `1px solid rgba(135,152,106,0.14)`,
          borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem',
        }}>
          <p style={{
            color: T.subtle, fontSize: '0.72rem', fontWeight: '700',
            margin: '0 0 0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            روابط التواصل الاجتماعي
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {SOCIAL_FIELDS.map(({ key, label, placeholder, Icon, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{
                  width: '33px', height: '33px', borderRadius: '8px', flexShrink: 0,
                  background: `${color}14`, border: `1px solid ${color}38`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={color} />
                </div>
                <input
                  type="url" value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="glass-input" dir="ltr"
                  style={{ flex: 1, padding: '0.58rem 0.8rem', borderRadius: '9px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
                <motion.button
                  type="button"
                  onClick={() => setQrTarget(key)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  title="امسح رمز QR"
                  style={{
                    width: '33px', height: '33px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(135,152,106,0.12)', border: '1px solid rgba(135,152,106,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: T.palm,
                  }}
                >
                  <QrCode size={15} />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        <SubmitBtn loading={loading}>حفظ التغييرات</SubmitBtn>
      </form>
    </ModalShell>
    </>
  );
}

/* ── Social chip ────────────────────────────────────────── */
function SocialChip({ url }) {
  const p = detectPlatform(url);
  if (!p) return null;
  const { name, color, textColor, Icon } = p;
  return (
    <motion.a
      href={url} target="_blank" rel="noopener noreferrer"
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 13px', borderRadius: '20px', textDecoration: 'none',
        background: `${color}14`, border: `1px solid ${color}40`,
        color: textColor || color, fontSize: '0.82rem', fontWeight: '600',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
    >
      <Icon size={14} />
      {name}
      <ExternalLink size={11} style={{ opacity: 0.55 }} />
    </motion.a>
  );
}

/* ── Badges definition ──────────────────────────────────── */
const BADGES = [
  { id: 'first',   emoji: '🌱', label: 'أول خطوة',          desc: 'زرعت شجرتك الأولى',         check: (c) => c >= 1  },
  { id: 'ten',     emoji: '🌳', label: 'عشرة أشجار',         desc: 'وصلت إلى 10 أشجار',          check: (c) => c >= 10 },
  { id: 'fifty',   emoji: '🌲', label: 'خمسون شجرة',         desc: 'أنجزت 50 شجرة مباركة',       check: (c) => c >= 50 },
  { id: 'hundred', emoji: '🏅', label: 'مئة شجرة',           desc: 'بطل الغرس! 100 شجرة',        check: (c) => c >= 100 },
  { id: 'champ',   emoji: '🏆', label: 'أفضل في المحافظة',   desc: 'الأول في محافظتك',           check: (_, isChamp) => isChamp },
];

function BadgesSection({ treesCount, isProvChamp }) {
  const earned = BADGES.filter(b => b.check(treesCount, isProvChamp));
  const locked = BADGES.filter(b => !b.check(treesCount, isProvChamp));

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ color: T.subtle, fontSize: '0.72rem', fontWeight: '700', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        الشارات
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {earned.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 280 }}
            title={b.desc}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, rgba(74,94,51,0.5), rgba(113,131,85,0.3))',
              border: '1px solid rgba(144,169,85,0.4)',
              borderRadius: '99px', padding: '5px 12px',
              fontSize: '0.78rem', fontWeight: '700', color: T.text,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{b.emoji}</span>
            {b.label}
          </motion.div>
        ))}
        {locked.map(b => (
          <div
            key={b.id}
            title={b.desc}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(30,46,20,0.3)', border: '1px solid rgba(135,152,106,0.1)',
              borderRadius: '99px', padding: '5px 12px',
              fontSize: '0.78rem', fontWeight: '600', color: 'rgba(207,225,185,0.2)',
              filter: 'grayscale(1)',
            }}
          >
            <span style={{ fontSize: '1rem', opacity: 0.3 }}>{b.emoji}</span>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ProfilePage ───────────────────────────────────── */
export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [impact, setImpact] = useState(null);
  const [isProvChamp, setIsProvChamp] = useState(false);

  useEffect(() => {
    api.get('/trees/my').then(res => {
      const trees = res.data;
      const totalCO2 = trees.reduce((s, t) => s + (t.co2Absorbed || 0), 0);
      const totalO2  = trees.reduce((s, t) => s + (t.o2Produced  || 0), 0);
      setImpact({ totalCO2: totalCO2.toFixed(1), totalO2: totalO2.toFixed(1) });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/trees/governorates').then(async res => {
      const govs = res.data;
      for (const gov of govs) {
        try {
          const top = await api.get(`/trees/governorates/${encodeURIComponent(gov.name)}/top`);
          if (top.data[0]?.userId === user.userId || top.data[0]?.displayName === user.displayName) {
            setIsProvChamp(true);
            break;
          }
        } catch {}
      }
    }).catch(() => {});
  }, [user]);

  if (!user) return null;

  const allSocialLinks = [
    user.instagramLink, user.facebookLink,
    user.snapchatLink,  user.telegramLink, user.twitterLink,
  ].filter(Boolean);

  const infoRows = [
    { icon: AtSign,   label: 'معرف الحساب',        value: `@${user.userId}`,   dir: 'ltr' },
    { icon: User,     label: 'الاسم الظاهر',        value: user.displayName                },
    ...(user.phone ? [{ icon: Phone, label: 'الهاتف', value: user.phone, dir: 'ltr' }] : []),
    { icon: TreePine, label: 'الأشجار المزروعة',    value: user.treesCount ?? 0, accent: true },
  ];

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '0 1rem' }}>
      <AnimatePresence>
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
        {showEditProfile && (
          <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onSaved={updateUser} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card"
        style={{ borderRadius: '24px', overflow: 'hidden' }}
      >
        {/* Header banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,46,20,0.95) 0%, rgba(74,94,51,0.85) 50%, rgba(113,131,85,0.55) 100%)',
          borderBottom: `1px solid rgba(135,152,106,0.22)`,
          padding: '2.5rem 2rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative glows */}
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(135,152,106,0.1) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '-30px', width: '140px', height: '140px',
            background: 'radial-gradient(circle, rgba(113,131,85,0.08) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          {/* Edit button */}
          <motion.button
            onClick={() => setShowEditProfile(true)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute', top: '14px', left: '14px',
              background: 'rgba(135,152,106,0.15)', border: `1px solid rgba(135,152,106,0.28)`,
              borderRadius: '10px', cursor: 'pointer', padding: '6px 12px',
              color: T.text, display: 'flex', alignItems: 'center',
              gap: '6px', fontSize: '0.78rem', fontWeight: '700',
            }}
          >
            <Edit3 size={12} /> تعديل
          </motion.button>

          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{
              width: '86px', height: '86px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(74,94,51,0.6), rgba(113,131,85,0.4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '2rem', fontWeight: '800', color: T.cream,
              border: '3px solid rgba(135,152,106,0.35)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.38)', overflow: 'hidden',
            }}
          >
            {user.profileImage
              ? <img src={user.profileImage} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.displayName?.[0]?.toUpperCase()
            }
          </motion.div>

          <h1 style={{ color: T.cream, fontSize: '1.4rem', fontWeight: '800', margin: '0 0 0.25rem' }}>
            {user.displayName}
          </h1>
          <p style={{ color: T.muted, fontSize: '0.87rem', margin: 0 }}>@{user.userId}</p>

          {allSocialLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '7px', marginTop: '1rem' }}
            >
              {allSocialLinks.map((url, i) => <SocialChip key={i} url={url} />)}
            </motion.div>
          )}
        </div>

        {/* Info rows */}
        <div style={{ padding: '1.5rem 1.75rem' }}>

          {/* Impact totals */}
          {impact && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                display: 'flex', gap: '10px', marginBottom: '1.25rem',
              }}
            >
              <div style={{
                flex: 1, background: 'rgba(20,83,45,0.35)', border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: '14px', padding: '0.85rem 1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#4ade80' }}>{impact.totalCO2}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(134,239,172,0.55)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Leaf size={10} /> CO₂ ممتص (كجم)
                </div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(30,58,95,0.35)', border: '1px solid rgba(147,197,253,0.2)',
                borderRadius: '14px', padding: '0.85rem 1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#93c5fd' }}>{impact.totalO2}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(147,197,253,0.55)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Wind size={10} /> O₂ منتج (كجم)
                </div>
              </div>
            </motion.div>
          )}

          {/* Badges */}
          <BadgesSection treesCount={user.treesCount ?? 0} isProvChamp={isProvChamp} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
            {infoRows.map(({ icon: Icon, label, value, dir, accent }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.78rem 1rem',
                  background: 'rgba(30,46,20,0.4)', border: `1px solid rgba(135,152,106,0.1)`,
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.muted, fontSize: '0.85rem' }}>
                  <Icon size={14} color={T.palm} /> {label}
                </div>
                <span style={{
                  fontWeight: '700',
                  color: accent ? T.palm : T.text,
                  fontSize: accent ? '1.05rem' : '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  ...(dir ? { direction: dir } : {}),
                }}>
                  {accent && <TreePine size={14} />} {value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <motion.button
              onClick={() => setShowEditProfile(true)}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{
                width: '100%', padding: '0.8rem', fontSize: '0.93rem', fontWeight: '700',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <Edit3 size={15} /> تعديل الملف الشخصي
            </motion.button>

            <motion.button
              onClick={() => setShowChangePassword(true)}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '0.78rem',
                background: 'rgba(30,46,20,0.5)', color: T.muted,
                border: `1px solid rgba(135,152,106,0.15)`,
                borderRadius: '12px', fontSize: '0.88rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'all 0.2s',
              }}
            >
              <Lock size={14} /> تغيير كلمة المرور
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
