import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import GovernoratesPage from './pages/GovernoratesPage';
import AdminDashboard from './pages/AdminDashboard';

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/map" replace />} />
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
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>
          Developed &amp; Engineered by Abdulwahab H.Murad
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
          جميع الحقوق محفوظة &copy; GreenIQ 2026
        </p>
      </footer>
    </div>
  );
}

export default App;
