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
  isAutoLoggingIn: boolean;
  error: Error | null;
  login: (user: User) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  clearError: () => void;
  setAutoLoginCallback: (callback: () => Promise<void>) => void;
}

const TOKEN_KEY = 'docGithubToken';
const USER_KEY = 'docGithubUser';
const HAS_LOGGED_IN_BEFORE = 'docHasLoggedInBefore';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [autoLoginCallback, setAutoLoginCallbackState] = useState<(() => Promise<void>) | null>(null);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  
  // 初期化時にセッションストレージから認証情報を復元
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setIsLoading(false);
      return;
    }
    
    try {
      // セッションストレージから復元
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      const storedUser = sessionStorage.getItem(USER_KEY);
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, token: storedToken });
        setIsLoading(false);
      } else {
        // セッションにない場合、過去にログインしたことがあるかチェック
        const hasLoggedInBefore = localStorage.getItem(HAS_LOGGED_IN_BEFORE) === 'true';
        if (hasLoggedInBefore && autoLoginCallback) {
          // 自動ログインを試みる
          setIsAutoLoggingIn(true);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to restore auth state:', err);
      setError(new Error('Failed to restore authentication'));
      setIsLoading(false);
    }
  }, []);
  
  // 自動ログインの実行（一度だけ）
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (!autoLoginCallback) return;
    if (hasAttemptedAutoLogin) return; // 既に試行済みならスキップ
    
    const hasLoggedInBefore = localStorage.getItem(HAS_LOGGED_IN_BEFORE) === 'true';
    const hasCurrentSession = sessionStorage.getItem(TOKEN_KEY) !== null;
    
    // 過去にログインしたことがあり、かつ現在のセッションがない場合
    if (hasLoggedInBefore && !hasCurrentSession && !user) {
      setHasAttemptedAutoLogin(true); // 試行したことを記録
      setIsAutoLoggingIn(true);
      autoLoginCallback()
        .then(() => {
          // 成功時は何もしない（login関数が呼ばれてuserが設定される）
        })
        .catch(err => {
          console.error('Auto-login failed:', err);
          setError(new Error('自動ログインに失敗しました。手動でログインしてください。'));
        })
        .finally(() => {
          setIsAutoLoggingIn(false);
        });
    }
  }, [autoLoginCallback, user, hasAttemptedAutoLogin]);
  
  const login = useCallback((newUser: User) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    try {
      // セッションストレージに保存
      sessionStorage.setItem(TOKEN_KEY, newUser.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify({
        ...newUser,
        token: undefined, // トークンは別キーで保存
      }));
      
      // 過去にログインしたことがあることを記録
      localStorage.setItem(HAS_LOGGED_IN_BEFORE, 'true');
      
      setUser(newUser);
      setError(null);
      setIsAutoLoggingIn(false);
    } catch (err) {
      const error = new Error('Failed to save authentication');
      setError(error);
      throw error;
    }
  }, []);
  
  const logout = useCallback(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    try {
      // セッションストレージから削除
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      
      // 自動ログインフラグも削除（ログアウトは自動ログインの資格も破棄する）
      localStorage.removeItem(HAS_LOGGED_IN_BEFORE);
      
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
      sessionStorage.setItem(TOKEN_KEY, token);
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
  
  const setAutoLoginCallback = useCallback((callback: () => Promise<void>) => {
    setAutoLoginCallbackState(() => callback);
  }, []);
  
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAutoLoggingIn,
    error,
    login,
    logout,
    updateToken,
    clearError,
    setAutoLoginCallback,
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