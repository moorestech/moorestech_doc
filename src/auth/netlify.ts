// Minimal Authenticator adapted from decap-cms-lib-auth (NetlifyAuthenticator)
// Provides window popup OAuth handshake for GitHub via a proxy (base_url/authEndpoint)

type AuthConfig = {
  site_id?: string | null;
  base_url?: string;
  auth_endpoint?: string;
};

type AuthenticateOptions = {
  provider: 'github' | string;
  scope?: string;
  login?: boolean;
  beta_invite?: string;
  invite_code?: string;
};

class NetlifyError {
  err: any;
  constructor(err: any) {
    this.err = err;
  }
  toString() {
    return this.err && this.err.message;
  }
}

const DEFAULT_BASE = 'https://api.netlify.com';
const DEFAULT_ENDPOINT = 'auth';

const PROVIDERS: Record<string, { width: number; height: number }> = {
  github: { width: 960, height: 600 },
  gitlab: { width: 960, height: 600 },
  bitbucket: { width: 960, height: 500 },
  email: { width: 500, height: 400 },
};

export class NetlifyAuthenticator {
  site_id: string | null;
  base_url: string;
  auth_endpoint: string;
  private authWindow: Window | null = null;

  constructor(config: AuthConfig = {}) {
    const trimEnd = (s?: string, ch: string = '/') => (s ? s.replace(new RegExp(`${ch}+$`), '') : s);
    const trim = (s?: string, ch: string = '/') => (s ? s.replace(new RegExp(`^${ch}+|${ch}+$`, 'g'), '') : s);

    this.site_id = config.site_id ?? null;
    this.base_url = trimEnd(config.base_url || DEFAULT_BASE) || DEFAULT_BASE;
    this.auth_endpoint = trim(config.auth_endpoint || DEFAULT_ENDPOINT) || DEFAULT_ENDPOINT;
  }

  private getSiteID() {
    if (this.site_id) return this.site_id;
    const host = typeof document !== 'undefined' ? document.location.host.split(':')[0] : '';
    return host === 'localhost' ? 'demo.decapcms.org' : host;
  }

  authenticate(options: AuthenticateOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      const provider = options.provider;
      const siteID = this.getSiteID();
      if (!provider) {
        return reject(new NetlifyError({ message: 'provider is required' }));
      }
      if (!siteID) {
        return reject(
          new NetlifyError({
            message: "You must set a site_id to authenticate from localhost",
          }),
        );
      }

      const conf = PROVIDERS[provider] || PROVIDERS.github;
      const left = window.screen.width / 2 - conf.width / 2;
      const top = window.screen.height / 2 - conf.height / 2;

      const handshakeCallback = (e: MessageEvent) => {
        if (e.data === 'authorizing:' + provider && e.origin === this.base_url) {
          window.removeEventListener('message', handshakeCallback, false);
          window.addEventListener('message', authorizeCallback, false);
          this.authWindow?.postMessage(e.data, e.origin);
        }
      };

      const authorizeCallback = (e: MessageEvent) => {
        if (e.origin !== this.base_url) return;
        const successPrefix = `authorization:${provider}:success:`;
        const errorPrefix = `authorization:${provider}:error:`;
        if (typeof e.data === 'string' && e.data.indexOf(successPrefix) === 0) {
          const json = e.data.substring(successPrefix.length);
          try {
            const data = JSON.parse(json);
            window.removeEventListener('message', authorizeCallback, false);
            this.authWindow?.close();
            resolve(data);
          } catch (err) {
            window.removeEventListener('message', authorizeCallback, false);
            this.authWindow?.close();
            reject(err);
          }
        }
        if (typeof e.data === 'string' && e.data.indexOf(errorPrefix) === 0) {
          const json = e.data.substring(errorPrefix.length);
          try {
            const err = JSON.parse(json);
            window.removeEventListener('message', authorizeCallback, false);
            this.authWindow?.close();
            reject(new NetlifyError(err));
          } catch (err) {
            window.removeEventListener('message', authorizeCallback, false);
            this.authWindow?.close();
            reject(err);
          }
        }
      };

      window.addEventListener('message', handshakeCallback, false);

      let url = `${this.base_url}/${this.auth_endpoint}?provider=${provider}&site_id=${siteID}`;
      if (options.scope) url += `&scope=${encodeURIComponent(options.scope)}`;
      if (options.login) url += `&login=true`;
      if (options.beta_invite) url += `&beta_invite=${encodeURIComponent(options.beta_invite)}`;
      if (options.invite_code) url += `&invite_code=${encodeURIComponent(options.invite_code)}`;

      this.authWindow = window.open(
        url,
        'Netlify Authorization',
        `width=${conf.width}, height=${conf.height}, top=${top}, left=${left}`,
      );
      this.authWindow?.focus();
    });
  }
}

export default NetlifyAuthenticator;

