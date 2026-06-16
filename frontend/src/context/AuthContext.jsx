import { createContext, useState, useContext } from 'react';

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
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};