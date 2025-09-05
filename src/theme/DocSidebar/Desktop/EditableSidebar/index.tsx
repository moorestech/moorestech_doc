import React, { useCallback } from 'react';
import styles from './EditableSidebar.module.css';
import { useAuthToken } from '../../../../auth/contexts/AuthContext';
import { EditableSidebarProps, DOCS_ROOT } from './types';
import { useRepository, useFileTree, useChangeManager, usePullRequest } from './hooks';
import { RepoHeader, FileTreeNode } from './components';

export default function EditableSidebar({ items, path }: EditableSidebarProps) {
  const token = useAuthToken();
  
  // Custom hooks
  const { repo, branch, loadingRepo, error, setError } = useRepository();
  const { root, expanded, toggleExpand, loadChildren, listDirectory, isDirEmpty } = useFileTree(repo, branch);
  const { 
    changes, 
    clearChanges, 
    stageAddFile, 
    stageAddFolder, 
    stageDeleteFile, 
    stageDeleteFolder, 
    stageMoveFile, 
    changesSummary 
  } = useChangeManager();
  const { applyChanges } = usePullRequest();

  // Handle apply changes
  const handleApplyChanges = useCallback(async () => {
    if (!repo) return;
    await applyChanges(
      repo,
      changes,
      branch,
      listDirectory,
      () => {
        // On success
        clearChanges();
        // Reload tree
        listDirectory(repo.owner, repo.repo, DOCS_ROOT).then(children => {
          // Tree will be updated automatically in the hook
        });
      },
      setError
    );
  }, [repo, changes, branch, listDirectory, clearChanges, setError, applyChanges]);

  // Handle reload
  const handleReload = useCallback(async () => {
    if (!repo) return;
    const children = await listDirectory(repo.owner, repo.repo, DOCS_ROOT);
    // Tree will be updated automatically in the hook
  }, [repo, listDirectory]);

  return (
    <div className={styles.editableSidebar}>
      {!loadingRepo && repo && (
        <RepoHeader 
          repo={repo} 
          branch={branch} 
          onReload={handleReload} 
        />
      )}

      {loadingRepo && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>⏳</div>
          <div className={styles.placeholderText}>リポジトリ情報を取得中...</div>
        </div>
      )}

      {!loadingRepo && error && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>⚠️</div>
          <div className={styles.placeholderText}>エラー</div>
          <div className={styles.placeholderDescription}>{error}</div>
        </div>
      )}

      {!loadingRepo && !error && (
        <div className={styles.fileTree}>
          <FileTreeNode
            node={root}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            onLoadChildren={loadChildren}
            onAddFile={stageAddFile}
            onAddFolder={stageAddFolder}
            onDeleteFile={stageDeleteFile}
            onDeleteFolder={(dirPath, node) => stageDeleteFolder(dirPath, node, isDirEmpty)}
            onMoveFile={stageMoveFile}
          />
        </div>
      )}
    </div>
  );
}
