import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token); setUser(data.user);
  };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
