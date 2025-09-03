import React, { useState } from 'react';
import { useGitHubAuth } from '../../auth/github';
import styles from './LoginPrompt.module.css';
import { useHistory } from '@docusaurus/router';

interface LoginPromptProps {
  documentPath: string;
}

export default function LoginPrompt({ documentPath }: LoginPromptProps) {
  const { login } = useGitHubAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
      // After successful login, keep edit=true and let parent render the editor
      // by virtue of isLoggedIn() now returning true.
    } catch (e: any) {
      setError(e?.toString?.() || 'Login failed');
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

