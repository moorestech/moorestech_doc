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

// LocalStorageには認証済みフラグのみ保存（トークンは保存しない）
const HAS_LOGGED_IN_BEFORE = 'docHasLoggedInBefore';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [autoLoginCallback, setAutoLoginCallbackState] = useState<(() => Promise<void>) | null>(null);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  
  // 初期化時の処理（メモリのみ管理のため、ストレージからの復元は行わない）
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setIsLoading(false);
      return;
    }
    
    try {
      // 過去にログインしたことがあるかチェック（トークンは復元しない）
      const hasLoggedInBefore = localStorage.getItem(HAS_LOGGED_IN_BEFORE) === 'true';
      if (hasLoggedInBefore && autoLoginCallback && !user) {
        // 自動ログインを試みる（OAuth認証を再実行）
        setIsAutoLoggingIn(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to initialize auth state:', err);
      setError(new Error('Failed to initialize authentication'));
      setIsLoading(false);
    }
  }, []);
  
  // 自動ログインの実行（一度だけ）
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (!autoLoginCallback) return;
    if (hasAttemptedAutoLogin) return; // 既に試行済みならスキップ
    
    const hasLoggedInBefore = localStorage.getItem(HAS_LOGGED_IN_BEFORE) === 'true';
    
    // 過去にログインしたことがあり、かつ現在ログインしていない場合
    if (hasLoggedInBefore && !user) {
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
      // トークンはメモリのみに保存（ストレージには保存しない）
      // LocalStorageには認証済みフラグのみ保存
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
      // メモリから削除（ストレージには何も保存していないので削除不要）
      // 自動ログインフラグも削除（ログアウトは自動ログインの資格も破棄する）
      localStorage.removeItem(HAS_LOGGED_IN_BEFORE);
      
      setUser(null);
      setError(null);
      setHasAttemptedAutoLogin(false); // 次回の自動ログインを可能にする
    } catch (err) {
      console.error('Failed to clear auth state:', err);
    }
  }, []);
  
  const updateToken = useCallback((token: string) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (!user) return;
    
    try {
      // トークンはメモリのみで管理
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