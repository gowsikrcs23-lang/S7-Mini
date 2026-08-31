import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('hospital_user') || 'null'));
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('hospital_token', data.token);
    localStorage.setItem('hospital_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('hospital_token', data.token);
    localStorage.setItem('hospital_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('hospital_token');
    if (!token) return;
    const loadingStartedAt = Date.now();
    const minimumLoadingTime = 2000;
    let finishTimer;

    setLoading(true);
    api.get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('hospital_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(logout)
      .finally(() => {
        const elapsed = Date.now() - loadingStartedAt;
        const remaining = Math.max(0, minimumLoadingTime - elapsed);
        finishTimer = window.setTimeout(() => setLoading(false), remaining);
      });

    return () => window.clearTimeout(finishTimer);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, isAdmin: user?.role === 'Admin' }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
