import React from 'react';
import styles from '../../InlineEditor.module.css';
import { useAuth } from '@site/src/auth/contexts/AuthContext';
import { useSaveAndPr } from '../../hooks/useSaveAndPr';
import HeaderTitle from './HeaderTitle';
import RepoIndicator from './RepoIndicator';
import StatusDisplay from './StatusDisplay';
import SaveButton from './SaveButton';
import LogoutButton from './LogoutButton';

interface EditorHeaderProps {
  documentPath: string;
  repoInfo?: { owner: string; repo: string } | null;
  content?: string;
}

/**
 * エディターのヘッダーコンポーネント
 */
export default function EditorHeader({ documentPath, repoInfo, content }: EditorHeaderProps) {
  const { user } = useAuth();
  const token = user?.token || null;
  
  const { isSaving, status, resultUrl, error, onSaveClick } = useSaveAndPr({
    documentPath,
    content,
    token,
    repoInfo,
  });

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <HeaderTitle documentPath={documentPath} />
        <RepoIndicator repoInfo={repoInfo} />
      </div>
      <div className={styles.headerRight}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDisplay status={status} error={error} resultUrl={resultUrl} />
          <SaveButton onSaveClick={onSaveClick} isSaving={isSaving} />
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}