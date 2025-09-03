import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

interface User {
  token: string;
  provider: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (user: User) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  clearError: () => void;
}

const TOKEN_KEY = 'docGithubToken';
const USER_KEY = 'docGithubUser';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 初期化時にローカルストレージから認証情報を復元
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setIsLoading(false);
      return;
    }
    
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, token: storedToken });
      }
    } catch (err) {
      console.error('Failed to restore auth state:', err);
      setError(new Error('Failed to restore authentication'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // ストレージイベントをリッスン（他のタブでのログイン/ログアウトを検知）
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (e.newValue === null) {
          setUser(null);
        } else {
          try {
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser({ ...parsedUser, token: e.newValue });
            }
          } catch (err) {
            console.error('Failed to sync auth state:', err);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const login = useCallback((newUser: User) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    try {
      localStorage.setItem(TOKEN_KEY, newUser.token);
      localStorage.setItem(USER_KEY, JSON.stringify({
        ...newUser,
        token: undefined, // トークンは別キーで保存
      }));
      setUser(newUser);
      setError(null);
    } catch (err) {
      const error = new Error('Failed to save authentication');
      setError(error);
      throw error;
    }
  }, []);
  
  const logout = useCallback(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Failed to clear auth state:', err);
    }
  }, []);
  
  const updateToken = useCallback((token: string) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (!user) return;
    
    try {
      localStorage.setItem(TOKEN_KEY, token);
      setUser(prev => prev ? { ...prev, token } : null);
    } catch (err) {
      const error = new Error('Failed to update token');
      setError(error);
      throw error;
    }
  }, [user]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    updateToken,
    clearError,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 便利なヘルパーhooks
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useAuthToken() {
  const { user } = useAuth();
  return user?.token || null;
}