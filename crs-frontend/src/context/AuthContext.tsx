import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { LoginResponse } from '../types/auth';

interface AuthUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'STUDENT';
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'crs_token';
const USER_KEY = 'crs_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem(USER_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth:logout', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth:logout', checkAuth);
    };
  }, []);

  const login = (data: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    const authUser: AuthUser = { id: data.userId, username: data.username, role: data.role };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phai duoc dung ben trong AuthProvider');
  return ctx;
}
