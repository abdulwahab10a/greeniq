import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, UserPlus, LogIn, X } from 'lucide-react';
import { useColors } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

// Shown when a guest tries an account-only action (planting, profile, ...).
// Browsing stays free; this nudges them to create an account to continue.
export default function GuestPromptModal({ open, onClose }) {
  const C = useColors();
  const { t } = useLang();
  const navigate = useNavigate();

  const go = (path) => { onClose(); navigate(path); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(8, 14, 5, 0.78)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            onClick={e => e.stopPropagation()}
            className="glass-card"
            style={{
              borderRadius: '24px', padding: '2rem 1.75rem',
              width: '100%', maxWidth: '420px', textAlign: 'center', position: 'relative',
            }}
          >
            <button onClick={onClose} style={{
              position: 'absolute', top: '14px', left: '14px',
              background: 'rgba(135,152,106,0.12)', border: '1px solid rgba(135,152,106,0.25)',
              borderRadius: '8px', cursor: 'pointer', padding: '5px',
              color: C.textMuted, display: 'flex', alignItems: 'center',
            }}>
              <X size={15} />
            </button>

            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 280 }}
              style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1.1rem',
                background: 'rgba(74,222,128,0.12)', border: '1.5px solid rgba(74,222,128,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Sprout size={30} color="#4ade80" />
            </motion.div>

            <h2 key={String(C.L)} style={{
              fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.6rem',
              background: C.headingGrad, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block',
            }}>
              {t('أنشئ حساباً للمتابعة')}
            </h2>

            <p style={{ color: C.textMuted, fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              {t('يمكنك تصفح الموقع والخريطة بحرية، لكن غرس الأشجار والإجراءات الخاصة بحسابك تتطلب إنشاء حساب. انضم إلينا مجاناً وابدأ بترك بصمتك الخضراء في العراق 🌱')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <motion.button
                onClick={() => go('/register')}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{
                  width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: '700',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <UserPlus size={16} /> {t('إنشاء حساب')}
              </motion.button>

              <motion.button
                onClick={() => go('/login')}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '0.78rem',
                  background: C.rowBg, color: C.textMuted,
                  border: `1px solid ${C.rowBorder}`,
                  borderRadius: '12px', fontSize: '0.88rem', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                <LogIn size={15} /> {t('تسجيل الدخول')}
              </motion.button>

              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '0.5rem', background: 'none', border: 'none',
                  color: C.textFaint, fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {t('ربما لاحقاً')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
