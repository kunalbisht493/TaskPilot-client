import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await authApi.getHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Backend server offline or unreachable:', err.message);
      setHealth({ status: 'offline' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getMe();
      if ((data?.authenticated || data?.success) && data?.user) {
        setUser({
          ...data.user,
          isConnectedToCalendar: Boolean(data.user.hasGoogleCalendar || data.user.isConnectedToCalendar),
        });
      } else {
        setUser(null);
      }
      setError(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    refreshUser();
  }, [fetchHealth, refreshUser]);

  const devLogin = async (customUser = {}) => {
    setLoading(true);
    try {
      const data = await authApi.devLogin(customUser);
      if (data?.user) {
        const normalized = {
          ...data.user,
          isConnectedToCalendar: Boolean(data.user.hasGoogleCalendar || data.user.isConnectedToCalendar),
        };
        setUser(normalized);
        setError(null);
        return { ...data, user: normalized };
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        health,
        error,
        refreshUser,
        fetchHealth,
        devLogin,
        logout,
        isAuthenticated: !!user,
        isConnectedToCalendar: Boolean(user?.isConnectedToCalendar),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
