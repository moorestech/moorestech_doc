import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import NetlifyAuthenticator from '../auth/netlify';

const TOKEN_KEY = 'docGithubToken';

export function getToken(): string | null {
  if (!ExecutionEnvironment.canUseDOM) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function setToken(token: string) {
  if (!ExecutionEnvironment.canUseDOM) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function logout() {
  if (!ExecutionEnvironment.canUseDOM) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function useGitHubAuth() {
  const { siteConfig } = useDocusaurusContext();
  const custom = (siteConfig?.customFields || {}) as any;
  const base_url: string = custom.authBaseUrl || 'https://api.netlify.com';
  const auth_endpoint: string = custom.authEndpoint || 'auth';
  const scope: string = custom.authScope || 'public_repo';

  const login = async () => {
    const authenticator = new NetlifyAuthenticator({ base_url, auth_endpoint });
    const data = await authenticator.authenticate({ provider: 'github', scope });
    if (data && data.token) {
      setToken(data.token);
    }
    return data;
  };

  return {
    login,
    isLoggedIn: () => isLoggedIn(),
    logout,
    getToken,
  };
}

