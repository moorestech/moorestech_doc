import { useState, useCallback, useMemo } from 'react';
import { Change, TreeNode } from '../types';

interface UseChangeManagerReturn {
  changes: Change[];
  clearChanges: () => void;
  stageAddFile: (dirPath: string) => void;
  stageAddFolder: (dirPath: string) => void;
  stageDeleteFile: (filePath: string) => void;
  stageDeleteFolder: (dirPath: string, node: TreeNode, isDirEmpty: (node: TreeNode) => boolean) => void;
  stageMoveFile: (filePath: string) => void;
  stageMoveItems: (items: { path: string; type: 'file' | 'dir' }[], targetPath: string) => void;
  changesSummary: string;
  selectedPaths: Set<string>;
  toggleSelection: (path: string, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  isSelected: (path: string) => boolean;
}

export const useChangeManager = (): UseChangeManagerReturn => {
  const [changes, setChanges] = useState<Change[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const clearChanges = useCallback(() => setChanges([]), []);
  const clearSelection = useCallback(() => setSelectedPaths(new Set()), []);
  const isSelected = useCallback((path: string) => selectedPaths.has(path), [selectedPaths]);
  
  const toggleSelection = useCallback((path: string, isMultiSelect: boolean) => {
    setSelectedPaths(prev => {
      const newSet = new Set(prev);
      if (isMultiSelect) {
        // Ctrl/Cmd+Click: toggle individual selection
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
      } else {
        // Regular click: select only this item
        newSet.clear();
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const stageAddFile = useCallback((dirPath: string) => {
    const name = window.prompt('新しいファイル名 (.md 推奨):');
    if (!name) return;
    const path = `${dirPath.replace(/\/$/, '')}/${name}`;
    const content = `# ${name.replace(/\.[^/.]+$/, '')}`;
    setChanges((c) => [...c, { kind: 'addFile', path, content }]);
  }, []);

  const stageAddFolder = useCallback((dirPath: string) => {
    const name = window.prompt('新しいフォルダ名:');
    if (!name) return;
    const path = `${dirPath.replace(/\/$/, '')}/${name}`;
    // Implement folder by adding a .gitkeep
    setChanges((c) => [...c, { kind: 'addFolder', path }]);
  }, []);

  const stageDeleteFile = useCallback((filePath: string) => {
    if (!window.confirm(`${filePath} を削除しますか？`)) return;
    setChanges((c) => [...c, { kind: 'deleteFile', path: filePath }]);
  }, []);

  const stageMoveFile = useCallback((filePath: string) => {
    const to = window.prompt('新しいパスを入力してください:', filePath);
    if (!to || to === filePath) return;
    setChanges((c) => [...c, { kind: 'moveFile', from: filePath, to }]);
  }, []);
  
  const stageMoveItems = useCallback((items: { path: string; type: 'file' | 'dir' }[], targetPath: string) => {
    const newChanges: Change[] = items.map(item => {
      const fileName = item.path.split('/').pop();
      const newPath = `${targetPath}/${fileName}`;
      
      // Avoid moving to the same location or into itself
      if (item.path === newPath || targetPath.startsWith(item.path + '/')) {
        return null;
      }
      
      return { kind: 'moveFile' as const, from: item.path, to: newPath };
    }).filter(Boolean) as Change[];
    
    if (newChanges.length > 0) {
      setChanges((c) => [...c, ...newChanges]);
      clearSelection();
    }
  }, [clearSelection]);

  const stageDeleteFolder = useCallback((dirPath: string, node: TreeNode, isDirEmpty: (node: TreeNode) => boolean) => {
    if (!isDirEmpty(node)) {
      window.alert('空でないフォルダの削除は未対応です。先に中身を削除してください。');
      return;
    }
    if (!window.confirm(`${dirPath} フォルダを削除しますか？`)) return;
    setChanges((c) => [...c, { kind: 'deleteFolder', path: dirPath }]);
  }, []);

  const changesSummary = useMemo(() => changes.map((c, i) => {
    if (c.kind === 'moveFile') return `${i + 1}. move: ${c.from} -> ${c.to}`;
    if (c.kind === 'addFile') return `${i + 1}. add file: ${c.path}`;
    if (c.kind === 'deleteFile') return `${i + 1}. delete file: ${c.path}`;
    if (c.kind === 'addFolder') return `${i + 1}. add folder: ${c.path}`;
    if (c.kind === 'deleteFolder') return `${i + 1}. delete folder: ${c.path}`;
    return '';
  }).join('\n'), [changes]);

  return {
    changes,
    clearChanges,
    stageAddFile,
    stageAddFolder,
    stageDeleteFile,
    stageDeleteFolder,
    stageMoveFile,
    stageMoveItems,
    changesSummary,
    selectedPaths,
    toggleSelection,
    clearSelection,
    isSelected,
  };
};