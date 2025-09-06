import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './EditableSidebar.module.css';
import { useIsEditing } from '../../../../contexts/EditStateContext';
import { useAuthToken } from '../../../../auth/contexts/AuthContext';
import { EditableSidebarProps } from './types';
import { FileTreeNode, ChangeManagementPanel } from './components';
import { useFileSystem } from '../../../../contexts/FileSystemContext';

export default function EditableSidebar({ items, path }: EditableSidebarProps) {
  const isEditing = useIsEditing();
  const token = useAuthToken();
  const {
    root,
    loadChildren,
    listDirectory,
    isDirEmpty,
    addFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    changes,
    clearChanges,
    saveAllChanges,
    repo,
    loading,
    error,
    // selection for editor
    selectFile,
  } = useFileSystem();

  // Local UI state for expanded/selection within the tree
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.path]));
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const toggleExpand = useCallback((p: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p); else n.add(p);
      return n;
    });
  }, []);
  const isSelected = useCallback((p: string) => selectedPaths.has(p), [selectedPaths]);
  const toggleSelection = useCallback((p: string, isMulti: boolean) => {
    setSelectedPaths(prev => {
      const n = new Set(prev);
      if (isMulti) {
        if (n.has(p)) n.delete(p); else n.add(p);
      } else {
        n.clear();
        n.add(p);
        // Single select: if a file, set as editor target
        if (!p.endsWith('/')) selectFile(p);
      }
      return n;
    });
  }, [selectFile]);

  const handleAddFile = useCallback((dirPath: string) => {
    const name = window.prompt('新しいファイル名 (.md 推奨):');
    if (!name) return;
    const path = `${dirPath.replace(/\/$/, '')}/${name}`;
    addFile(path);
  }, [addFile]);

  const handleAddFolder = useCallback((dirPath: string) => {
    const name = window.prompt('新しいフォルダ名:');
    if (!name) return;
    const path = `${dirPath.replace(/\/$/, '')}/${name}`;
    addFolder(path);
  }, [addFolder]);

  const handleDeleteFile = useCallback((filePath: string) => {
    if (!window.confirm(`${filePath} を削除しますか？`)) return;
    deleteFile(filePath);
  }, [deleteFile]);

  const handleDeleteFolder = useCallback((dirPath: string) => {
    // Allow delete only when empty in current view
    const ok = window.confirm(`${dirPath} フォルダを削除しますか？(空フォルダのみ)`);
    if (!ok) return;
    deleteFolder(dirPath);
  }, [deleteFolder]);

  const handleMoveFile = useCallback((filePath: string) => {
    const to = window.prompt('新しいパスを入力してください:', filePath);
    if (!to || to === filePath) return;
    moveFile(filePath, to);
  }, [moveFile]);

  const handleMoveItems = useCallback((items: { path: string; type: 'file' | 'dir' }[], targetPath: string) => {
    items.forEach(item => {
      if (item.type === 'file') {
        const to = `${targetPath.replace(/\/$/, '')}/${item.path.split('/').pop()}`;
        if (to !== item.path) moveFile(item.path, to);
      }
      // Directory move not supported in this simplified pass
    });
  }, [moveFile]);

  const handleApplyChanges = useCallback(async () => {
    await saveAllChanges();
  }, [saveAllChanges]);

  // Ensure root directory contents load on initial open
  useEffect(() => {
    // Load only when authenticated, repo resolved (not loading), no error, and root not yet loaded
    if (!loading && !error && token && root && root.type === 'dir' && !root.loaded) {
      // If root is considered expanded by default, prefetch its children
      loadChildren(root);
    }
  }, [loading, error, token, root, loadChildren]);

  if (!isEditing) return null;

  // トークンがない場合はログイン待機画面を表示
  if (!token) {
    return (
      <div className={styles.editableSidebar}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🔒</div>
          <div className={styles.placeholderText}>ログインが必要です</div>
          <div className={styles.placeholderDescription}>
            ファイルツリーを表示するにはGitHubアカウントでログインしてください
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.editableSidebar}>
        {loading && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⏳</div>
            <div className={styles.placeholderText}>リポジトリ情報を取得中...</div>
          </div>
        )}
        {!loading && error && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⚠️</div>
            <div className={styles.placeholderText}>エラー</div>
            <div className={styles.placeholderDescription}>{error}</div>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className={styles.fileTree}>
              <FileTreeNode
                node={root}
                expanded={expanded}
                selectedPaths={selectedPaths}
                onToggleExpand={toggleExpand}
                onLoadChildren={loadChildren}
                onAddFile={handleAddFile}
                onAddFolder={handleAddFolder}
                onDeleteFile={handleDeleteFile}
                onDeleteFolder={(dirPath, _node) => handleDeleteFolder(dirPath)}
                onMoveFile={handleMoveFile}
                onMoveItems={handleMoveItems}
                onToggleSelection={toggleSelection}
                isSelected={isSelected}
              />
            </div>
            <ChangeManagementPanel
              changes={changes}
              onApplyChanges={handleApplyChanges}
              onClearChanges={clearChanges}
            />
          </>
        )}
      </div>
    </DndProvider>
  );
}
