import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useColors } from './context/ThemeContext';
import { useLang } from './context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

// Pages — lazy-loaded so each route (and its heavy deps like Leaflet or the
// QR scanner) ships as a separate chunk fetched only when that page is visited.
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const MapPage          = lazy(() => import('./pages/MapPage'));
const LeaderboardPage  = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const GovernoratesPage = lazy(() => import('./pages/GovernoratesPage'));
const AirQualityPage   = lazy(() => import('./pages/AirQualityPage'));
const RecommendationPage = lazy(() => import('./pages/RecommendationPage'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const HomePage         = lazy(() => import('./pages/HomePage'));

// Components — Navbar is eager (always visible); ChatBot is deferred (global
// overlay, not needed for first paint).
import Navbar from './components/Navbar';
const ChatBot = lazy(() => import('./components/ChatBot'));

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/map" replace />;
  return children;
}

// Centered spinner — shown while auth resolves or a lazy page chunk loads.
function PageLoader() {
  const { t } = useLang();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '6rem 1rem', flexDirection: 'column', gap: '16px',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: '3px solid rgba(79,119,45,0.2)',
          borderTopColor: '#90a955',
        }}
      />
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>{t('جاري التحميل...')}</span>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();
  const C = useColors();
  const { t } = useLang();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public browsing routes — guests can view everything below. */}
            <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
            <Route path="/map" element={<AnimatedPage><MapPage /></AnimatedPage>} />
            <Route path="/leaderboard" element={<AnimatedPage><LeaderboardPage /></AnimatedPage>} />
            <Route path="/governorates" element={<AnimatedPage><GovernoratesPage /></AnimatedPage>} />
            <Route path="/air-quality" element={<AnimatedPage><AirQualityPage /></AnimatedPage>} />
            <Route path="/recommend" element={<AnimatedPage><RecommendationPage /></AnimatedPage>} />
            {/* Account-only routes. */}
            <Route path="/profile" element={
              <ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute><AnimatedPage><AdminDashboard /></AnimatedPage></AdminRoute>
            } />
          </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 1rem',
        borderTop: '1px solid rgba(144,169,85,0.15)',
        marginTop: 'auto',
      }}>
        <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>
          Developed &amp; Engineered by Innovators Team
        </p>
        <p style={{ color: C.textSubtle, fontSize: '0.78rem', marginBottom: '0.6rem' }}>
          {t('جميع الحقوق محفوظة')} &copy; GreenIQ 2026
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ color: C.textFaint, fontSize: '0.78rem' }}>
            {t('تواصل معنا ✉️ greeniq964@gmail.com')}
          </span>
          <a
            href="https://mail.google.com/mail/?view=cm&to=greeniq964@gmail.com&su=GreenIQ%20%E2%80%94%20%D9%85%D9%84%D8%A7%D8%AD%D8%B8%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%AE%D8%AF%D9%85"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(144,169,85,0.1)', border: '1px solid rgba(144,169,85,0.28)',
              color: '#90a955', borderRadius: '99px', padding: '3px 13px',
              fontSize: '0.78rem', fontWeight: '600', textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(144,169,85,0.2)';
              e.currentTarget.style.borderColor = 'rgba(144,169,85,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(144,169,85,0.1)';
              e.currentTarget.style.borderColor = 'rgba(144,169,85,0.28)';
            }}
          >
            ✉️ {t('أرسل ملاحظة')}
          </a>
        </div>
      </footer>
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </div>
  );
}

export default App;
