import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  clearAuthSession,
  getTokenExpirationTime,
  hasValidStoredSession,
} from '@/utils/authSession';

export interface UserInfo {
  userId: string;
  fullName: string;
  userName: string;
  avatarUrl: string | null;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (token: string, user: UserInfo, expiredAt?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (!hasValidStoredSession()) {
      clearAuthSession(false);
      return null;
    }
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? (JSON.parse(savedUser) as UserInfo) : null;
    } catch {
      clearAuthSession(false);
      return null;
    }
  });

  const login = (token: string, userInfo: UserInfo, expiredAt?: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    if (expiredAt) localStorage.setItem('tokenExpiredAt', expiredAt);
    else localStorage.removeItem('tokenExpiredAt');
    setUser(userInfo);
  };

  const logout = () => {
    clearAuthSession(false);
    setUser(null);
  };

  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'user') {
        if (!hasValidStoredSession()) setUser(null);
      }
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const expiresAt = getTokenExpirationTime();
    if (expiresAt === null) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    const timer = window.setTimeout(logout, remaining);
    return () => window.clearTimeout(timer);
  }, [user]);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
