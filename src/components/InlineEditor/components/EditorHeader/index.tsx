import React from 'react';
import styles from '../../InlineEditor.module.css';
import HeaderTitle from './HeaderTitle';
import RepoIndicator from './RepoIndicator';
import StatusDisplay from './StatusDisplay';
import SaveButton from './SaveButton';
import LogoutButton from './LogoutButton';
import { useFileSystem } from '@site/src/contexts/FileSystemContext';

interface EditorHeaderProps {
  documentPath: string;
}

/**
 * エディターのヘッダーコンポーネント
 */
export default function EditorHeader({ documentPath }: EditorHeaderProps) {
  const { repo, isSaving, status, resultUrl, saveAllChanges } = useFileSystem();
  const repoInfo = repo ? { owner: repo.owner, repo: repo.repo } : null;

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <HeaderTitle documentPath={documentPath} />
        <RepoIndicator repoInfo={repoInfo} />
      </div>
      <div className={styles.headerRight}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDisplay status={status} error={null} resultUrl={resultUrl} />
          <SaveButton onSaveClick={saveAllChanges} isSaving={isSaving} />
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
