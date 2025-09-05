import React, { useCallback, useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './EditableSidebar.module.css';
import { useFileSystem } from '../../../../contexts/FileSystemContext';
import { useIsEditing } from '../../../../contexts/EditStateContext';
import { FileTreeNode } from './components/FileTreeNode';

export default function EditableSidebar() {
  const isEditing = useIsEditing();
  
  console.log('[EditableSidebar] Component mounted, isEditing:', isEditing);
  
  const {
    fileSystem,
    repository,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    moveNodes,
    selectFile,
    toggleDirectory,
    loadDirectoryContents,
    createPullRequest,
    hasUnsavedChanges,
    clearChanges
  } = useFileSystem();
  
  // 複数選択の状態
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  
  // ファイル/フォルダ追加
  const handleAddFile = useCallback((dirPath: string) => {
    const name = window.prompt('新しいファイル名 (.md 推奨):');
    if (!name) return;
    
    const content = `# ${name.replace(/\.[^/.]+$/, '')}`;
    createFile(dirPath, name, content);
  }, [createFile]);
  
  const handleAddFolder = useCallback((dirPath: string) => {
    const name = window.prompt('新しいフォルダ名:');
    if (!name) return;
    
    createDirectory(dirPath, name);
  }, [createDirectory]);
  
  // リネーム
  const handleRename = useCallback((path: string) => {
    const node = fileSystem.root;
    const currentName = path.split('/').pop() || '';
    const newName = window.prompt('新しい名前:', currentName);
    if (!newName || newName === currentName) return;
    
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const newPath = `${parentPath}/${newName}`.replace(/\/+/g, '/');
    renameNode(path, newPath);
  }, [fileSystem.root, renameNode]);
  
  // 選択処理
  const handleSelect = useCallback((path: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedPaths(prev => {
        const newSet = new Set(prev);
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
        return newSet;
      });
    } else {
      setSelectedPaths(new Set([path]));
      // ファイルの場合は編集用に選択
      const node = fileSystem.root.children.get(path.split('/').pop() || '');
      if (node?.type === 'file') {
        selectFile(path);
      }
    }
  }, [fileSystem.root, selectFile]);
  
  // PR作成
  const handleCreatePR = useCallback(async () => {
    if (!hasUnsavedChanges() || isCreatingPR) return;
    
    const title = window.prompt('Pull Request のタイトル:', 'Update documentation');
    if (!title) return;
    
    const description = window.prompt('Pull Request の説明 (オプション):', '');
    
    setIsCreatingPR(true);
    try {
      const prUrl = await createPullRequest(title, description || '');
      window.alert(`Pull Request を作成しました: ${prUrl}`);
      clearChanges();
      setSelectedPaths(new Set());
    } catch (error) {
      console.error('PR作成エラー:', error);
      window.alert(`エラー: ${error instanceof Error ? error.message : 'PR作成に失敗しました'}`);
    } finally {
      setIsCreatingPR(false);
    }
  }, [hasUnsavedChanges, isCreatingPR, createPullRequest, clearChanges]);
  
  // 変更のサマリー
  const changesSummary = useMemo(() => {
    const changes = fileSystem.changes;
    return {
      creates: changes.filter(c => c.type === 'create').length,
      modifies: changes.filter(c => c.type === 'modify').length,
      deletes: changes.filter(c => c.type === 'delete').length,
      renames: changes.filter(c => c.type === 'rename').length,
      total: changes.length
    };
  }, [fileSystem.changes]);
  
  // 編集モードでない場合は非表示
  if (!isEditing) {
    console.log('[EditableSidebar] Not in edit mode, returning null');
    return null;
  }
  
  console.log('[EditableSidebar] Rendering with fileSystem:', {
    isLoading: fileSystem.isLoading,
    error: fileSystem.error,
    rootChildren: fileSystem.root.children.size
  });
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.editableSidebar}>
        {fileSystem.isLoading && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⏳</div>
            <div className={styles.placeholderText}>読み込み中...</div>
          </div>
        )}
        
        {fileSystem.error && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>⚠️</div>
            <div className={styles.placeholderText}>エラー</div>
            <div className={styles.placeholderDescription}>{fileSystem.error}</div>
          </div>
        )}
        
        {!fileSystem.isLoading && !fileSystem.error && (
          <>
            <div className={styles.fileTree}>
              <FileTreeNode
                node={fileSystem.root}
                selectedPaths={selectedPaths}
                onSelect={handleSelect}
                onToggleExpand={toggleDirectory}
                onLoadChildren={loadDirectoryContents}
                onAddFile={handleAddFile}
                onAddFolder={handleAddFolder}
                onDelete={deleteNode}
                onRename={handleRename}
                onMoveItems={moveNodes}
              />
            </div>
            
            {changesSummary.total > 0 && (
              <div className={styles.changesPanel}>
                <div className={styles.changesSummary}>
                  <h4>変更内容</h4>
                  <div className={styles.changeStats}>
                    {changesSummary.creates > 0 && (
                      <span>➕ 新規: {changesSummary.creates}</span>
                    )}
                    {changesSummary.modifies > 0 && (
                      <span>✏️ 変更: {changesSummary.modifies}</span>
                    )}
                    {changesSummary.deletes > 0 && (
                      <span>🗑️ 削除: {changesSummary.deletes}</span>
                    )}
                    {changesSummary.renames > 0 && (
                      <span>↔️ 移動: {changesSummary.renames}</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.changeActions}>
                  <button
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={handleCreatePR}
                    disabled={isCreatingPR}
                  >
                    {isCreatingPR ? '作成中...' : 'PR作成'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => {
                      if (window.confirm('すべての変更を破棄しますか？')) {
                        clearChanges();
                        setSelectedPaths(new Set());
                      }
                    }}
                    disabled={isCreatingPR}
                  >
                    破棄
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DndProvider>
  );
}