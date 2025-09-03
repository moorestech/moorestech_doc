import React, { useState } from 'react';
import { useGitHubAuth } from '../../auth/hooks/useGitHubAuth';
import styles from './LoginPrompt.module.css';
import { useHistory } from '@docusaurus/router';

interface LoginPromptProps {
  documentPath: string;
}

export default function LoginPrompt({ documentPath }: LoginPromptProps) {
  const { login, isAuthenticated } = useGitHubAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
      console.log('[LoginPrompt] Login successful, isAuthenticated:', isAuthenticated);
      // After successful login, the parent component will re-render
      // and show the editor instead of login prompt
    } catch (e: any) {
      console.error('[LoginPrompt] Login failed:', e);
      setError(e?.message || e?.toString?.() || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    // Remove ?edit=true to return to view mode
    history.push(documentPath);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>GitHub にログインしてください</div>
      <div className={styles.desc}>エディタを開くには GitHub 認証が必要です。</div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.buttons}>
        <button className={styles.primaryButton} onClick={onLogin} disabled={loading}>
          {loading ? 'ログイン中…' : 'GitHubでログイン'}
        </button>
        <button className={styles.secondaryButton} onClick={onCancel} disabled={loading}>
          閲覧に戻る
        </button>
      </div>
    </div>
  );
}

