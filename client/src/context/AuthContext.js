import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

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

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          const { dailyFileCount, dailyLimit, lastFileDate, ...cleanUser } = JSON.parse(storedUser);
          setUser(cleanUser);
          const { data } = await authAPI.refresh();
          const { dailyFileCount: dfc, dailyLimit: dl, lastFileDate: lfd, ...cleanData } = data;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(cleanData));
          setUser(cleanData);
        } catch {
          try {
            const { data } = await authAPI.getProfile();
            const { dailyFileCount, dailyLimit, lastFileDate, ...cleanData } = data;
            localStorage.setItem('user', JSON.stringify(cleanData));
            setUser(cleanData);
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { dailyFileCount, dailyLimit, lastFileDate, ...cleanUser } = data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(cleanUser));
    setUser(cleanUser);
    return cleanUser;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const { dailyFileCount, dailyLimit, lastFileDate, ...cleanUser } = data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(cleanUser));
    setUser(cleanUser);
    return cleanUser;
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
      const { dailyFileCount, dailyLimit, lastFileDate, ...cleanData } = data;
      const updatedUser = { ...user, ...cleanData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return cleanData;
    } catch {
      return user;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
