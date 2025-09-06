import React, { useCallback } from 'react';
import styles from '../../InlineEditor.module.css';
import { useAuth } from '@site/src/auth/contexts/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  
  const onLogout = useCallback(() => {
    logout();
    // Reload so DocItem gate re-evaluates auth and shows login prompt if still in edit mode
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [logout]);

  return (
    <button 
      className={styles.exitButton}
      onClick={onLogout}
      title="Logout"
    >
      🔓 Logout
    </button>
  );
}