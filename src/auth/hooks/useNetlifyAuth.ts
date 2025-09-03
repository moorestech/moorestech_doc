import { useState, useCallback, useRef } from 'react';

type AuthProvider = 'github' | 'gitlab' | 'bitbucket' | 'email';

interface AuthOptions {
  provider: AuthProvider;
  scope?: string;
  login?: boolean;
  betaInvite?: string;
  inviteCode?: string;
}

interface AuthConfig {
  siteId?: string | null;
  baseUrl?: string;
  authEndpoint?: string;
}

interface AuthResult {
  token: string;
  provider: string;
  [key: string]: any;
}

const PROVIDER_CONFIGS: Record<AuthProvider, { width: number; height: number }> = {
  github: { width: 960, height: 600 },
  gitlab: { width: 960, height: 600 },
  bitbucket: { width: 960, height: 500 },
  email: { width: 500, height: 400 },
};

const DEFAULT_BASE_URL = 'https://api.netlify.com';
const DEFAULT_AUTH_ENDPOINT = 'auth';

export function useNetlifyAuth(config: AuthConfig = {}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const authWindowRef = useRef<Window | null>(null);
  
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const authEndpoint = (config.authEndpoint || DEFAULT_AUTH_ENDPOINT).replace(/^\/+|\/+$/g, '');
  
  const getSiteId = useCallback(() => {
    if (config.siteId) return config.siteId;
    const host = typeof window !== 'undefined' 
      ? window.location.host.split(':')[0] 
      : '';
    return host === 'localhost' ? 'demo.decapcms.org' : host;
  }, [config.siteId]);
  
  const authenticate = useCallback(async (options: AuthOptions): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      const { provider } = options;
      const siteId = getSiteId();
      
      if (!provider) {
        const err = new Error('Provider is required');
        setError(err);
        setIsAuthenticating(false);
        reject(err);
        return;
      }
      
      if (!siteId) {
        const err = new Error('Site ID is required for authentication');
        setError(err);
        setIsAuthenticating(false);
        reject(err);
        return;
      }
      
      const providerConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.github;
      const left = window.screen.width / 2 - providerConfig.width / 2;
      const top = window.screen.height / 2 - providerConfig.height / 2;
      
      let timeoutId: NodeJS.Timeout;
      
      const cleanupListeners = () => {
        window.removeEventListener('message', handshakeHandler);
        window.removeEventListener('message', authorizationHandler);
        if (timeoutId) clearTimeout(timeoutId);
      };
      
      const handshakeHandler = (e: MessageEvent) => {
        if (e.data === `authorizing:${provider}` && e.origin === baseUrl) {
          window.removeEventListener('message', handshakeHandler);
          window.addEventListener('message', authorizationHandler);
          authWindowRef.current?.postMessage(e.data, e.origin);
        }
      };
      
      const authorizationHandler = (e: MessageEvent) => {
        if (e.origin !== baseUrl) return;
        
        const successPrefix = `authorization:${provider}:success:`;
        const errorPrefix = `authorization:${provider}:error:`;
        
        if (typeof e.data === 'string') {
          if (e.data.startsWith(successPrefix)) {
            try {
              const result = JSON.parse(e.data.substring(successPrefix.length));
              cleanupListeners();
              authWindowRef.current?.close();
              authWindowRef.current = null;
              setIsAuthenticating(false);
              resolve(result);
            } catch (err) {
              cleanupListeners();
              authWindowRef.current?.close();
              authWindowRef.current = null;
              setError(err as Error);
              setIsAuthenticating(false);
              reject(err);
            }
          } else if (e.data.startsWith(errorPrefix)) {
            try {
              const errorData = JSON.parse(e.data.substring(errorPrefix.length));
              const err = new Error(errorData.message || 'Authentication failed');
              cleanupListeners();
              authWindowRef.current?.close();
              authWindowRef.current = null;
              setError(err);
              setIsAuthenticating(false);
              reject(err);
            } catch (err) {
              cleanupListeners();
              authWindowRef.current?.close();
              authWindowRef.current = null;
              setError(err as Error);
              setIsAuthenticating(false);
              reject(err);
            }
          }
        }
      };
      
      window.addEventListener('message', handshakeHandler);
      
      const params = new URLSearchParams({
        provider,
        site_id: siteId,
        ...(options.scope && { scope: options.scope }),
        ...(options.login && { login: 'true' }),
        ...(options.betaInvite && { beta_invite: options.betaInvite }),
        ...(options.inviteCode && { invite_code: options.inviteCode }),
      });
      
      const authUrl = `${baseUrl}/${authEndpoint}?${params}`;
      
      authWindowRef.current = window.open(
        authUrl,
        'Netlify Authorization',
        `width=${providerConfig.width}, height=${providerConfig.height}, top=${top}, left=${left}`
      );
      
      authWindowRef.current?.focus();
      
      // タイムアウト設定
      timeoutId = setTimeout(() => {
        cleanupListeners();
        authWindowRef.current?.close();
        authWindowRef.current = null;
        const err = new Error('Authentication timeout');
        setError(err);
        setIsAuthenticating(false);
        reject(err);
      }, 5 * 60 * 1000); // 5分
    });
  }, [baseUrl, authEndpoint, getSiteId]);
  
  const cancelAuthentication = useCallback(() => {
    if (authWindowRef.current) {
      authWindowRef.current.close();
      authWindowRef.current = null;
      setIsAuthenticating(false);
      setError(new Error('Authentication cancelled'));
    }
  }, []);
  
  return {
    authenticate,
    cancelAuthentication,
    isAuthenticating,
    error,
  };
}