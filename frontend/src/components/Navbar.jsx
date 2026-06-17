import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LogIn, UserPlus, Map, Trophy, Building2, Menu, X, LayoutDashboard, Wind, Sun, Moon, Languages } from 'lucide-react';

/* ── Color tokens ── */
const C = {
  palmLeaf:    '#87986a',
  frostedMint: '#e9f5db',
  teaGreen:    '#cfe1b9',
  dustyOlive:  '#718355',
  hunter:      '#4a5e33',
};

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const isLight = theme === 'light';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={isLight ? t('تفعيل الوضع الداكن') : t('تفعيل الوضع الفاتح')}
      style={{
        background: isLight ? 'rgba(113,131,85,0.15)' : 'rgba(233,245,219,0.08)',
        border: isLight ? '1px solid rgba(113,131,85,0.3)' : '1px solid rgba(233,245,219,0.15)',
        borderRadius: '10px', padding: '7px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isLight ? '#4a5e33' : '#cfe1b9',
        transition: 'all 0.25s',
        flexShrink: 0,
      }}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0,   opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </motion.button>
  );
}

function LangToggle() {
  const { theme } = useTheme();
  const { lang, toggle } = useLang();
  const isLight = theme === 'light';
  const next = lang === 'ar' ? 'EN' : 'ع';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
      style={{
        background: isLight ? 'rgba(113,131,85,0.15)' : 'rgba(233,245,219,0.08)',
        border: isLight ? '1px solid rgba(113,131,85,0.3)' : '1px solid rgba(233,245,219,0.15)',
        borderRadius: '10px', padding: '7px 9px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px',
        color: isLight ? '#4a5e33' : '#cfe1b9',
        transition: 'all 0.25s', flexShrink: 0,
        fontSize: '0.78rem', fontWeight: '700', lineHeight: 1,
      }}
    >
      <Languages size={15} />
      <motion.span
        key={lang}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ minWidth: '14px', textAlign: 'center' }}
      >
        {next}
      </motion.span>
    </motion.button>
  );
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLang();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on navigation — intentional sync reset on route change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { to: '/map',          label: 'الخريطة',       icon: Map             },
    { to: '/leaderboard',  label: 'أفضل الزارعين', icon: Trophy          },
    { to: '/governorates', label: 'المحافظات',      icon: Building2       },
    { to: '/air-quality',  label: 'جودة الهواء',   icon: Wind            },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard }]
      : []),
  ];

  return (
    <>
      <nav style={{
        background: isLight ? 'rgba(235,245,222,0.95)' : 'rgba(10, 18, 7, 0.92)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderBottom: isLight ? '1px solid rgba(113,131,85,0.22)' : '1px solid rgba(135,152,106,0.18)',
        transition: 'background 0.3s, border-color 0.3s',
        padding: '0 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', height: '64px',
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <motion.div whileHover={{ scale: 1.04 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="float-icon" style={{ fontSize: '1.55rem' }}>🌿</span>
              <span key={theme} style={{
                fontSize: '1.2rem', fontWeight: '800',
                background: isLight
                  ? 'linear-gradient(135deg, #1a3d0a, #4a8c25)'
                  : `linear-gradient(135deg, ${C.palmLeaf}, ${C.frostedMint})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', letterSpacing: '-0.01em',
                display: 'inline-block',
              }}>
                GreenIQ
              </span>
            </motion.div>
          </Link>

          {/* ── Desktop nav ── hidden below md (links shown to guests too) */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.4rem' }}>
            <ThemeToggle />
            <LangToggle />
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '10px',
                      background: active ? 'rgba(135,152,106,0.18)' : 'transparent',
                      border: active ? '1px solid rgba(135,152,106,0.38)' : '1px solid transparent',
                      color: active
                        ? (isLight ? '#1a3d0a' : C.frostedMint)
                        : (isLight ? 'rgba(45,58,31,0.7)' : 'rgba(207,225,185,0.65)'),
                      fontSize: '0.88rem', fontWeight: active ? '700' : '400',
                      transition: 'all 0.2s', cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} color={active ? C.palmLeaf : 'rgba(135,152,106,0.7)'} />
                    {t(label)}
                  </motion.div>
                </Link>
              );
            })}

            {user ? (
              <>
                {/* Profile */}
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 10px', borderRadius: '10px',
                      background: location.pathname === '/profile'
                        ? 'rgba(135,152,106,0.18)' : 'rgba(74,94,51,0.38)',
                      border: '1px solid rgba(135,152,106,0.22)',
                      cursor: 'pointer',
                    }}
                  >
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.displayName} style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        objectFit: 'cover', border: `2px solid rgba(135,152,106,0.5)`,
                      }} />
                    ) : (
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', color: C.frostedMint, fontSize: '0.82rem',
                        border: `2px solid rgba(135,152,106,0.4)`,
                      }}>
                        {user.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: isLight ? '#2d3a1f' : C.teaGreen, fontWeight: '600', fontSize: '0.88rem' }}>
                      {user.displayName}
                    </span>
                  </motion.div>
                </Link>

                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: 'rgba(200, 60, 60, 0.1)',
                    border: '1px solid rgba(200, 60, 60, 0.28)',
                    color: '#f87171', padding: '7px 13px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <LogOut size={14} /> {t('خروج')}
                </motion.button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.35rem' }}>
                <Link to="/login" style={{ textDecoration: 'none', color: isLight ? 'rgba(45,58,31,0.7)' : 'rgba(207,225,185,0.65)', fontSize: '0.92rem' }}>
                  {t('دخول')}
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
                      color: C.frostedMint, padding: '8px 18px', borderRadius: '10px',
                      fontSize: '0.88rem', fontWeight: '700',
                      boxShadow: '0 4px 16px rgba(113,131,85,0.38)',
                    }}
                  >
                    {t('تسجيل جديد')}
                  </motion.div>
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile toggles + hamburger (guests and members alike) ── */}
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <LangToggle />
            <motion.button
              className="flex"
              onClick={() => setMobileOpen(o => !o)}
              whileTap={{ scale: 0.9 }}
              style={{
                background: mobileOpen ? 'rgba(135,152,106,0.2)' : 'rgba(74,94,51,0.4)',
                border: `1px solid ${mobileOpen ? 'rgba(135,152,106,0.4)' : 'rgba(135,152,106,0.2)'}`,
                borderRadius: '10px', padding: '9px', cursor: 'pointer',
                color: C.teaGreen, alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label={t('القائمة')}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── Mobile sidebar drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden"
              style={{
                position: 'fixed', inset: 0, zIndex: 1001,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
              }}
            />

            {/* Drawer panel (slides from right for RTL) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden"
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '72vw', maxWidth: '280px',
                zIndex: 1002,
                background: isLight ? 'rgba(235,245,222,0.99)' : 'rgba(9,18,6,0.98)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderLeft: isLight ? '1px solid rgba(113,131,85,0.22)' : '1px solid rgba(135,152,106,0.18)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1rem 0.75rem',
                borderBottom: isLight ? '1px solid rgba(113,131,85,0.15)' : '1px solid rgba(135,152,106,0.12)',
              }}>
                <span style={{
                  fontSize: '1rem', fontWeight: '800',
                  background: isLight
                    ? 'linear-gradient(135deg, #1a3d0a, #4a8c25)'
                    : `linear-gradient(135deg, ${C.palmLeaf}, ${C.frostedMint})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  🌿 GreenIQ
                </span>
                <motion.button
                  onClick={() => setMobileOpen(false)}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    background: 'rgba(135,152,106,0.12)',
                    border: '1px solid rgba(135,152,106,0.25)',
                    borderRadius: '8px', padding: '6px', cursor: 'pointer',
                    color: isLight ? '#4a5e33' : C.teaGreen,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Nav links */}
              <div style={{ padding: '0.75rem 0.75rem 0', flex: 1 }}>
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to;
                  return (
                    <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block' }}>
                      <motion.div
                        whileHover={{ x: -3 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '0.78rem 0.9rem', borderRadius: '12px', marginBottom: '4px',
                          background: active ? 'rgba(135,152,106,0.16)' : 'transparent',
                          border: active ? '1px solid rgba(135,152,106,0.32)' : '1px solid transparent',
                          color: active
                            ? (isLight ? '#1a3d0a' : C.frostedMint)
                            : (isLight ? 'rgba(45,58,31,0.75)' : 'rgba(207,225,185,0.72)'),
                          fontSize: '0.95rem', fontWeight: active ? '700' : '500',
                          transition: 'background 0.2s, border-color 0.2s',
                        }}
                      >
                        <Icon size={18} color={active ? C.palmLeaf : 'rgba(135,152,106,0.55)'} />
                        {t(label)}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom: Profile + Logout (member) — or Login + Register (guest) */}
              <div style={{ padding: '0.75rem' }}>
                <div style={{ height: '1px', background: 'rgba(135,152,106,0.12)', marginBottom: '0.6rem' }} />

                {user ? (
                  <>
                    <Link to="/profile" style={{ textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '0.72rem 0.9rem', borderRadius: '12px',
                        background: location.pathname === '/profile'
                          ? 'rgba(135,152,106,0.16)' : 'rgba(74,94,51,0.15)',
                        border: '1px solid rgba(135,152,106,0.18)',
                      }}>
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.displayName} style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            objectFit: 'cover', border: '2px solid rgba(135,152,106,0.4)', flexShrink: 0,
                          }} />
                        ) : (
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                            background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', color: C.frostedMint, fontSize: '0.85rem',
                            border: '2px solid rgba(135,152,106,0.4)',
                          }}>
                            {user.displayName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, color: isLight ? '#1a3d0a' : C.teaGreen, fontWeight: '600', fontSize: '0.9rem' }}>
                            {user.displayName}
                          </p>
                          <p style={{ margin: 0, color: isLight ? 'rgba(45,58,31,0.55)' : 'rgba(135,152,106,0.7)', fontSize: '0.75rem' }}>
                            {t('الملف الشخصي')}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '0.72rem 0.9rem', borderRadius: '12px',
                        background: 'rgba(200,60,60,0.08)',
                        border: '1px solid rgba(200,60,60,0.2)',
                        color: '#f87171', fontSize: '0.9rem', fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={18} /> {t('خروج من الحساب')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/register" style={{ textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
                      <div style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '0.78rem 0.9rem', borderRadius: '12px',
                        background: `linear-gradient(135deg, ${C.hunter}, ${C.dustyOlive})`,
                        color: C.frostedMint, fontSize: '0.92rem', fontWeight: '700',
                      }}>
                        <UserPlus size={17} /> {t('تسجيل جديد')}
                      </div>
                    </Link>
                    <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '0.72rem 0.9rem', borderRadius: '12px',
                        background: 'rgba(74,94,51,0.15)',
                        border: '1px solid rgba(135,152,106,0.18)',
                        color: isLight ? '#1a3d0a' : C.teaGreen, fontSize: '0.9rem', fontWeight: '600',
                      }}>
                        <LogIn size={16} /> {t('دخول')}
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
