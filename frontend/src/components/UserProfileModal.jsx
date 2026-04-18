import { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TreePine, Leaf, Wind, ExternalLink } from 'lucide-react';
import { FaInstagram, FaFacebook, FaSnapchatGhost, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function detectPlatform(url) {
  if (!url) return null;
  if (/instagram\.com/i.test(url))           return { name: 'Instagram', color: '#E1306C', Icon: FaInstagram    };
  if (/facebook\.com|fb\.com/i.test(url))    return { name: 'Facebook',  color: '#1877F2', Icon: FaFacebook     };
  if (/snapchat\.com/i.test(url))            return { name: 'Snapchat',  color: '#FFFC00', textColor: '#1a1a1a', Icon: FaSnapchatGhost };
  if (/t\.me|telegram\.(me|org)/i.test(url)) return { name: 'Telegram',  color: '#26A5E4', Icon: FaTelegram     };
  if (/twitter\.com|x\.com/i.test(url))      return { name: 'X',         color: '#b5c99a', Icon: FaXTwitter     };
  return { name: 'رابط', color: '#87986a', Icon: ExternalLink };
}

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then(res => setProfile(res.data))
      .finally(() => setLoading(false));
  }, [userId]);

  const socialLinks = profile ? [
    profile.instagramLink, profile.facebookLink,
    profile.snapchatLink,  profile.telegramLink, profile.twitterLink,
  ].filter(Boolean) : [];

  return (
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
          borderRadius: '24px', width: '100%', maxWidth: '380px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f1f0a 0%, #1a3010 50%, #243d16 100%)',
          borderBottom: '1px solid rgba(75,85,99,0.4)',
          padding: '2rem 1.75rem 1.5rem', textAlign: 'center', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', left: '12px',
            background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
            borderRadius: '8px', cursor: 'pointer', color: '#9ca3af',
            padding: '5px', display: 'flex', alignItems: 'center',
          }}>
            <X size={15} />
          </button>

          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(74,94,51,0.6), rgba(113,131,85,0.4))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.85rem',
            border: '3px solid rgba(74,222,128,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
            fontSize: '1.8rem', fontWeight: '800', color: '#e9f5db',
          }}>
            {loading ? '...' : profile?.profileImage
              ? <img src={profile.profileImage} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile?.displayName?.[0]?.toUpperCase()
            }
          </div>

          {loading ? (
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>جاري التحميل...</div>
          ) : (
            <>
              <h2 style={{ color: '#f9fafb', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 0.2rem' }}>
                {profile?.displayName}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0 }}>@{profile?.userId}</p>
            </>
          )}
        </div>

        {/* Body */}
        {!loading && profile && (
          <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                { icon: TreePine, label: 'الأشجار المزروعة', value: `${profile.treesCount} شجرة`, color: '#4ade80', bg: '#14532d' },
                { icon: Leaf,     label: 'CO₂ المختزل',      value: `${profile.totalCO2} كجم`,   color: '#86efac', bg: '#14532d' },
                { icon: Wind,     label: 'O₂ المنبعث',        value: `${profile.totalO2} كجم`,   color: '#93c5fd', bg: '#1e3a5f' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} style={{
                  background: bg, border: `1px solid ${color}22`,
                  borderRadius: '12px', padding: '0.65rem 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '0.83rem' }}>
                    <Icon size={13} color={color} /> {label}
                  </div>
                  <strong style={{ color, fontSize: '0.88rem' }}>{value}</strong>
                </div>
              ))}
            </div>

            {socialLinks.length > 0 && (
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: '700', margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  التواصل الاجتماعي
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {socialLinks.map((url, i) => {
                    const p = detectPlatform(url);
                    if (!p) return null;
                    const { name, color, textColor, Icon } = p;
                    return (
                      <motion.a
                        key={i} href={url} target="_blank" rel="noopener noreferrer"
                        whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.96 }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '6px 13px', borderRadius: '20px', textDecoration: 'none',
                          background: `${color}18`, border: `1px solid ${color}44`,
                          color: textColor || color, fontSize: '0.82rem', fontWeight: '600',
                        }}
                      >
                        <Icon size={14} /> {name} <ExternalLink size={10} style={{ opacity: 0.55 }} />
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
