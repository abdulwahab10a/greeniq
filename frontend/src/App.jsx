import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useColors } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import GovernoratesPage from './pages/GovernoratesPage';
import AirQualityPage from './pages/AirQualityPage';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';

// Components
import Navbar from './components/Navbar';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/map" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
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
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>جاري التحميل...</span>
    </div>
  );
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <ProtectedRoute><AnimatedPage><HomePage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
            <Route path="/map" element={
              <ProtectedRoute><AnimatedPage><MapPage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><AnimatedPage><LeaderboardPage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/governorates" element={
              <ProtectedRoute><AnimatedPage><GovernoratesPage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/air-quality" element={
              <ProtectedRoute><AnimatedPage><AirQualityPage /></AnimatedPage></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute><AnimatedPage><AdminDashboard /></AnimatedPage></AdminRoute>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 1rem',
        borderTop: '1px solid rgba(144,169,85,0.15)',
        marginTop: 'auto',
      }}>
        <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>
          Developed &amp; Engineered by Abdulwahab H.Murad
        </p>
        <p style={{ color: C.textSubtle, fontSize: '0.78rem', marginBottom: '0.6rem' }}>
          جميع الحقوق محفوظة &copy; GreenIQ 2026
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ color: C.textFaint, fontSize: '0.78rem' }}>
            تواصل معنا ✉️ greeniq964@gmail.com
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
            ✉️ أرسل ملاحظة
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
