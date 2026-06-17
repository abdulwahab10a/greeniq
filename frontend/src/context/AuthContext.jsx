import { createContext, useState, useContext, useCallback } from 'react';
import GuestPromptModal from '../components/GuestPromptModal';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize synchronously from localStorage: auth state is known on the
  // first render (no blank flash, no setState-in-effect).
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('greeniraq_user');
      const token = localStorage.getItem('token');
      return storedUser && token ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);
  // Shown when a guest triggers an account-only action (see requireAuth).
  const [guestPrompt, setGuestPrompt] = useState(false);

  // Gate for account-only actions: returns true when logged in, otherwise
  // opens the "create an account" prompt and returns false so callers bail out.
  const requireAuth = useCallback(() => {
    if (user) return true;
    setGuestPrompt(true);
    return false;
  }, [user]);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('greeniraq_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('greeniraq_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('greeniraq_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, requireAuth }}>
      {!loading && children}
      <GuestPromptModal open={guestPrompt} onClose={() => setGuestPrompt(false)} />
    </AuthContext.Provider>
  );
};