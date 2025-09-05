import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  FileSystemState, 
  FileSystemContextType, 
  RepositoryInfo,
  FileNode,
  DirectoryNode,
  FileChange,
  FileSystemNode
} from './types';
import {
  getNodeByPath,
  addNode,
  removeNode,
  updateFileInTree,
  getParentAndName,
  splitPath,
  cloneDirectory,
  collectDeletedNodes,
  collectModifiedFiles,
  collectNewNodes
} from './utils';
import { 
  listDirectory as listDirectoryApi
} from '../../utils/github';
import {
  getFileContent,
  createPullRequest as createPR
} from '../../utils/github/fileOperations';
import { useAuthToken } from '../../auth/contexts/AuthContext';
import { EditorConfig } from '../../config/editor.config';

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
}

interface FileSystemProviderProps {
  children: React.ReactNode;
}

export function FileSystemProvider({ children }: FileSystemProviderProps) {
  const token = useAuthToken();
  
  console.log('[FileSystemProvider] Initializing with token:', !!token);
  
  // 初期状態
  const [fileSystem, setFileSystem] = useState<FileSystemState>({
    root: {
      type: 'directory',
      name: 'docs',
      path: 'docs',
      children: new Map(),
      isExpanded: true
    },
    selectedFile: null,
    changes: [],
    isLoading: false,
    error: null
  });
  
  const [repository, setRepository] = useState<RepositoryInfo | null>(null);
  
  // リポジトリ情報の初期化
  useEffect(() => {
    const config = EditorConfig.getInstance();
    setRepository({
      owner: config.getOwner(),
      repo: config.getRepo(),
      branch: config.getBranch()
    });
  }, []);
  
  // ファイル作成
  const createFile = useCallback((parentPath: string, name: string, content: string = '') => {
    setFileSystem(prev => {
      const filePath = `${parentPath}/${name}`.replace(/\/+/g, '/');
      const newFile: FileNode = {
        type: 'file',
        name,
        path: filePath,
        content,
        isNew: true,
        isModified: false
      };
      
      const newRoot = addNode(prev.root, parentPath, newFile);
      const newChange: FileChange = {
        type: 'create',
        path: filePath,
        content,
        isDirectory: false
      };
      
      return {
        ...prev,
        root: newRoot,
        changes: [...prev.changes, newChange]
      };
    });
  }, []);
  
  // ディレクトリ作成
  const createDirectory = useCallback((parentPath: string, name: string) => {
    setFileSystem(prev => {
      const dirPath = `${parentPath}/${name}`.replace(/\/+/g, '/');
      const newDir: DirectoryNode = {
        type: 'directory',
        name,
        path: dirPath,
        children: new Map(),
        isNew: true,
        isExpanded: true
      };
      
      const newRoot = addNode(prev.root, parentPath, newDir);
      const newChange: FileChange = {
        type: 'create',
        path: dirPath,
        content: '',
        isDirectory: true
      };
      
      return {
        ...prev,
        root: newRoot,
        changes: [...prev.changes, newChange]
      };
    });
  }, []);
  
  // ノード削除
  const deleteNode = useCallback((path: string) => {
    setFileSystem(prev => {
      const node = getNodeByPath(prev.root, path);
      if (!node) return prev;
      
      const newRoot = cloneDirectory(prev.root);
      const nodeInNewRoot = getNodeByPath(newRoot, path);
      if (nodeInNewRoot) {
        nodeInNewRoot.isDeleted = true;
      }
      
      const newChange: FileChange = {
        type: 'delete',
        path,
        isDirectory: node.type === 'directory'
      };
      
      return {
        ...prev,
        root: newRoot,
        changes: [...prev.changes, newChange],
        selectedFile: prev.selectedFile === path ? null : prev.selectedFile
      };
    });
  }, []);
  
  // ノードのリネーム
  const renameNode = useCallback((oldPath: string, newPath: string) => {
    setFileSystem(prev => {
      const node = getNodeByPath(prev.root, oldPath);
      if (!node) return prev;
      
      let newRoot = removeNode(prev.root, oldPath);
      const { parentPath, name } = getParentAndName(newPath);
      
      const renamedNode: FileSystemNode = node.type === 'directory' 
        ? { ...node, name, path: newPath }
        : { ...node, name, path: newPath };
      
      newRoot = addNode(newRoot, parentPath, renamedNode);
      
      const newChange: FileChange = {
        type: 'rename',
        oldPath,
        newPath,
        isDirectory: node.type === 'directory'
      };
      
      return {
        ...prev,
        root: newRoot,
        changes: [...prev.changes, newChange],
        selectedFile: prev.selectedFile === oldPath ? newPath : prev.selectedFile
      };
    });
  }, []);
  
  // 複数ノードの移動
  const moveNodes = useCallback((sourcePaths: string[], targetPath: string) => {
    setFileSystem(prev => {
      let newRoot = cloneDirectory(prev.root);
      const newChanges: FileChange[] = [];
      
      for (const sourcePath of sourcePaths) {
        const node = getNodeByPath(newRoot, sourcePath);
        if (!node) continue;
        
        const fileName = sourcePath.split('/').pop() || '';
        const newPath = `${targetPath}/${fileName}`.replace(/\/+/g, '/');
        
        // 自分自身や子ディレクトリへの移動は防ぐ
        if (sourcePath === newPath || targetPath.startsWith(sourcePath + '/')) {
          continue;
        }
        
        newRoot = removeNode(newRoot, sourcePath);
        const movedNode: FileSystemNode = node.type === 'directory'
          ? { ...node, path: newPath }
          : { ...node, path: newPath };
        newRoot = addNode(newRoot, targetPath, movedNode);
        
        newChanges.push({
          type: 'rename',
          oldPath: sourcePath,
          newPath,
          isDirectory: node.type === 'directory'
        });
      }
      
      return {
        ...prev,
        root: newRoot,
        changes: [...prev.changes, ...newChanges]
      };
    });
  }, []);
  
  // ファイル内容の更新
  const updateFileContent = useCallback((path: string, content: string) => {
    setFileSystem(prev => {
      const node = getNodeByPath(prev.root, path);
      if (!node || node.type !== 'file') return prev;
      
      const newRoot = updateFileInTree(prev.root, path, content);
      
      // 変更の追跡
      let newChanges = [...prev.changes];
      if (!node.isNew) {
        const existingChange = newChanges.find(
          c => (c.type === 'modify' || c.type === 'create') && c.path === path
        );
        
        if (existingChange) {
          // 既存の変更を更新
          if (existingChange.type === 'modify' || existingChange.type === 'create') {
            existingChange.content = content;
          }
        } else {
          // 新しい変更を追加
          newChanges.push({
            type: 'modify',
            path,
            content,
            originalContent: node.originalContent || node.content
          });
        }
      }
      
      return {
        ...prev,
        root: newRoot,
        changes: newChanges
      };
    });
  }, []);
  
  // ファイル選択
  const selectFile = useCallback((path: string | null) => {
    setFileSystem(prev => ({
      ...prev,
      selectedFile: path
    }));
  }, []);
  
  // ディレクトリの展開/折りたたみ
  const toggleDirectory = useCallback((path: string) => {
    setFileSystem(prev => {
      const newRoot = cloneDirectory(prev.root);
      const node = getNodeByPath(newRoot, path);
      if (node?.type === 'directory') {
        node.isExpanded = !node.isExpanded;
      }
      return { ...prev, root: newRoot };
    });
  }, []);
  
  // ディレクトリ内容の読み込み
  const loadDirectoryContents = useCallback(async (path: string) => {
    if (!repository || !token) return;
    
    setFileSystem(prev => ({ ...prev, isLoading: true }));
    
    try {
      const items = await listDirectoryApi(
        repository.owner,
        repository.repo,
        path,
        repository.branch,
        token
      );
      
      setFileSystem(prev => {
        const newRoot = cloneDirectory(prev.root);
        const dir = getNodeByPath(newRoot, path);
        
        if (dir?.type === 'directory') {
          dir.children.clear();
          for (const item of items) {
            const childNode: FileSystemNode = item.type === 'dir'
              ? {
                  type: 'directory',
                  name: item.name,
                  path: item.path,
                  children: new Map(),
                  sha: item.sha,
                  isExpanded: false
                }
              : {
                  type: 'file',
                  name: item.name,
                  path: item.path,
                  content: '', // 遅延読み込み
                  sha: item.sha
                };
            dir.children.set(item.name, childNode);
          }
        }
        
        return {
          ...prev,
          root: newRoot,
          isLoading: false
        };
      });
    } catch (error) {
      setFileSystem(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load directory'
      }));
    }
  }, [repository, token]);
  
  // GitHubからファイル内容を読み込み
  const loadFromGitHub = useCallback(async (path: string) => {
    if (!repository || !token) return;
    
    setFileSystem(prev => ({ ...prev, isLoading: true }));
    
    try {
      const content = await getFileContent(
        repository.owner,
        repository.repo,
        path,
        repository.branch,
        token
      );
      
      setFileSystem(prev => {
        const newRoot = cloneDirectory(prev.root);
        const node = getNodeByPath(newRoot, path);
        
        if (node?.type === 'file') {
          node.content = content;
          node.originalContent = content;
          node.isModified = false;
        }
        
        return {
          ...prev,
          root: newRoot,
          isLoading: false
        };
      });
    } catch (error) {
      setFileSystem(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load file'
      }));
    }
  }, [repository, token]);
  
  // Pull Request作成
  const createPullRequest = useCallback(async (
    title: string = 'Update documentation',
    description: string = ''
  ): Promise<string> => {
    if (!repository || !token) {
      throw new Error('Repository or token not available');
    }
    
    const changes: Array<{
      path: string;
      content?: string;
      deleted?: boolean;
    }> = [];
    
    // 新規・変更ファイルを収集
    const newNodes = collectNewNodes(fileSystem.root);
    for (const node of newNodes) {
      if (node.type === 'file') {
        changes.push({
          path: node.path,
          content: node.content
        });
      }
    }
    
    const modifiedFiles = collectModifiedFiles(fileSystem.root);
    for (const file of modifiedFiles) {
      if (!file.isNew) {
        changes.push({
          path: file.path,
          content: file.content
        });
      }
    }
    
    // 削除ファイルを収集
    const deletedPaths = collectDeletedNodes(fileSystem.root);
    for (const path of deletedPaths) {
      changes.push({
        path,
        deleted: true
      });
    }
    
    if (changes.length === 0) {
      throw new Error('No changes to commit');
    }
    
    // PR作成（実際のGitHub API呼び出し）
    const prUrl = await createPR(
      repository.owner,
      repository.repo,
      repository.branch,
      title,
      description,
      changes,
      token
    );
    
    // 成功したら変更をクリア
    setFileSystem(prev => ({
      ...prev,
      changes: []
    }));
    
    return prUrl;
  }, [repository, token, fileSystem.root]);
  
  // ノード取得
  const getNode = useCallback((path: string): FileSystemNode | undefined => {
    return getNodeByPath(fileSystem.root, path);
  }, [fileSystem.root]);
  
  // 未保存の変更があるか
  const hasUnsavedChanges = useCallback((): boolean => {
    return fileSystem.changes.length > 0;
  }, [fileSystem.changes]);
  
  // 変更をクリア
  const clearChanges = useCallback(() => {
    setFileSystem(prev => ({
      ...prev,
      changes: []
    }));
  }, []);
  
  // 初期データの読み込み（開発モード用のモックデータ）
  useEffect(() => {
    if (!repository) return;
    
    // トークンがない場合はモックデータを使用
    if (!token) {
      console.log('[FileSystemProvider] No token, using mock data');
      
      // モックファイルツリーを設定
      setFileSystem(prev => {
        const mockRoot: DirectoryNode = {
          type: 'directory',
          name: 'docs',
          path: 'docs',
          children: new Map([
            ['intro.md', {
              type: 'file',
              name: 'intro.md',
              path: 'docs/intro.md',
              content: '# Introduction\n\nWelcome to the documentation!',
              originalContent: '# Introduction\n\nWelcome to the documentation!'
            }],
            ['tutorial', {
              type: 'directory',
              name: 'tutorial',
              path: 'docs/tutorial',
              children: new Map([
                ['basics.md', {
                  type: 'file',
                  name: 'basics.md',
                  path: 'docs/tutorial/basics.md',
                  content: '# Tutorial Basics\n\nLearn the basics here.',
                  originalContent: '# Tutorial Basics\n\nLearn the basics here.'
                }]
              ]),
              isExpanded: false
            }]
          ]),
          isExpanded: true
        };
        
        return {
          ...prev,
          root: mockRoot,
          isLoading: false
        };
      });
    } else {
      // 実際のGitHubデータを読み込み
      loadDirectoryContents('docs');
    }
  }, [repository, token, loadDirectoryContents]);
  
  const value = useMemo<FileSystemContextType>(() => ({
    fileSystem,
    repository,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    moveNodes,
    updateFileContent,
    selectFile,
    toggleDirectory,
    loadDirectoryContents,
    loadFromGitHub,
    createPullRequest,
    getNode,
    hasUnsavedChanges,
    clearChanges
  }), [
    fileSystem,
    repository,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    moveNodes,
    updateFileContent,
    selectFile,
    toggleDirectory,
    loadDirectoryContents,
    loadFromGitHub,
    createPullRequest,
    getNode,
    hasUnsavedChanges,
    clearChanges
  ]);
  
  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}