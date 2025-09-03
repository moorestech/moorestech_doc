import { useState, useCallback, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAuth } from '../contexts/AuthContext';
import { useNetlifyAuth } from './useNetlifyAuth';

interface GitHubAuthOptions {
  scope?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
}

interface GitHubUserInfo {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export function useGitHubAuth(options: GitHubAuthOptions = {}) {
  const { siteConfig } = useDocusaurusContext();
  const { user, login: authLogin, logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<GitHubUserInfo | null>(null);
  
  const customFields = (siteConfig?.customFields || {}) as any;
  const baseUrl = customFields.authBaseUrl || 'https://api.netlify.com';
  const authEndpoint = customFields.authEndpoint || 'auth';
  const defaultScope = customFields.authScope || 'public_repo';
  
  const netlifyAuth = useNetlifyAuth({
    baseUrl,
    authEndpoint,
  });
  
  // GitHubユーザー情報を取得
  const fetchUserInfo = useCallback(async (token: string): Promise<GitHubUserInfo | null> => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as GitHubUserInfo;
    } catch (err) {
      console.error('Failed to fetch GitHub user info:', err);
      return null;
    }
  }, []);
  
  // トークンが変更されたらユーザー情報を更新
  useEffect(() => {
    if (user?.token && user?.provider === 'github') {
      fetchUserInfo(user.token).then(setUserInfo);
    } else {
      setUserInfo(null);
    }
  }, [user, fetchUserInfo]);
  
  const login = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await netlifyAuth.authenticate({
        provider: 'github',
        scope: options.scope || defaultScope,
      });
      
      if (result && result.token) {
        // ユーザー情報を取得
        const info = await fetchUserInfo(result.token);
        
        const userData = {
          ...result,
          provider: 'github',
          ...(info && {
            login: info.login,
            email: info.email,
            name: info.name,
            avatar_url: info.avatar_url,
          }),
        };
        
        authLogin(userData);
        
        if (info) {
          setUserInfo(info);
        }
        
        options.onSuccess?.(userData);
        return userData;
      }
      
      throw new Error('No token received from authentication');
    } catch (err) {
      const error = err as Error;
      console.error('GitHub authentication failed:', error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [netlifyAuth, authLogin, fetchUserInfo, options, defaultScope]);
  
  const logout = useCallback(() => {
    authLogout();
    setUserInfo(null);
  }, [authLogout]);
  
  // GitHubリポジトリ操作のヘルパー関数
  const createRepo = useCallback(async (name: string, options?: any) => {
    if (!user?.token) throw new Error('Not authenticated');
    
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${user.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, ...options }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create repository: ${response.statusText}`);
    }
    
    return response.json();
  }, [user]);
  
  const getRepo = useCallback(async (owner: string, repo: string) => {
    if (!user?.token) throw new Error('Not authenticated');
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${user.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get repository: ${response.statusText}`);
    }
    
    return response.json();
  }, [user]);
  
  const getFileContent = useCallback(async (owner: string, repo: string, path: string) => {
    if (!user?.token) throw new Error('Not authenticated');
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${user.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get file content: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.content) {
      // Base64デコード
      const content = atob(data.content);
      return { ...data, decodedContent: content };
    }
    
    return data;
  }, [user]);
  
  const updateFileContent = useCallback(
    async (
      owner: string,
      repo: string,
      path: string,
      content: string,
      message: string,
      sha?: string
    ) => {
      if (!user?.token) throw new Error('Not authenticated');
      
      const encodedContent = btoa(content);
      
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${user.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            content: encodedContent,
            ...(sha && { sha }),
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`);
      }
      
      return response.json();
    },
    [user]
  );
  
  return {
    // 認証状態
    isAuthenticated: !!user && user.provider === 'github',
    user: user?.provider === 'github' ? user : null,
    userInfo,
    token: user?.provider === 'github' ? user.token : null,
    
    // 認証アクション
    login,
    logout,
    
    // 状態
    isLoading: isLoading || netlifyAuth.isAuthenticating,
    error: netlifyAuth.error,
    
    // GitHub API ヘルパー
    github: {
      createRepo,
      getRepo,
      getFileContent,
      updateFileContent,
    },
  };
}