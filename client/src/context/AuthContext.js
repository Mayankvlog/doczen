import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, fetchCSRFToken } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const extractUser = (data) => ({
    _id: data._id,
    name: data.name,
    email: data.email,
    storageUsed: data.storageUsed,
    storageLimit: data.storageLimit,
  });

  useEffect(() => {
    const restoreSession = async () => {
      await fetchCSRFToken();
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        if (isTokenExpired(token)) {
          try {
            const { data } = await authAPI.refresh();
            localStorage.setItem('token', data.token);
            const clean = extractUser(data);
            localStorage.setItem('user', JSON.stringify(clean));
            setUser(clean);
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const clean = extractUser(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(clean));
    setUser(clean);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const clean = extractUser(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(clean));
    setUser(clean);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...current, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return data;
    } catch {
      return user;
    }
  };

  const setUserData = (userData, token) => {
    const clean = extractUser(userData);
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(clean));
    setUser(clean);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
