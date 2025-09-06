import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useAuthToken } from '../auth/contexts/AuthContext';
import { useRepository } from '../hooks/useRepository';
import { useFileTree } from '../hooks/useFileTree';
import { useFileManager } from '../hooks/useFileManager';
import { usePullRequest } from '../hooks/usePullRequest';
import type { FileSystemContextValue } from '../hooks/types';

const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthToken();
  
  // Repository management
  const { repo, branch, loading, error } = useRepository(token);
  
  // File tree management
  const {
    root,
    setRoot,
    selectedFile,
    setSelectedFile,
    listDirectory,
    loadChildren,
    isDirEmpty,
    selectFile,
    resetRoot
  } = useFileTree(repo, branch, token);
  
  // File operations and change tracking
  const {
    changes,
    contentsRef,
    getFileContent,
    setFileContent,
    addFile,
    addBinaryFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    clearChanges,
    setChanges
  } = useFileManager({
    repo,
    branch,
    token,
    selectedFile,
    setSelectedFile,
    setRoot
  });
  
  // Pull request operations
  const {
    isSaving,
    status,
    resultUrl,
    saveAllChanges
  } = usePullRequest({
    repo,
    branch,
    token,
    changes,
    contentsRef,
    setChanges
  });
  
  // Reset root when repo changes
  useEffect(() => {
    if (repo) {
      resetRoot();
    }
  }, [repo, resetRoot]);

  const value: FileSystemContextValue = useMemo(() => ({
    // Repository
    repo,
    branch,
    loading,
    error,
    
    // Tree & selection
    root,
    listDirectory,
    loadChildren,
    isDirEmpty,
    selectedFile,
    selectFile,
    
    // Content access
    getFileContent,
    setFileContent,
    
    // File operations
    addFile,
    addBinaryFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    
    // Changes management
    changes,
    clearChanges,
    
    // Persist
    isSaving,
    status,
    resultUrl,
    saveAllChanges,
  }), [
    repo,
    branch,
    loading,
    error,
    root,
    listDirectory,
    loadChildren,
    isDirEmpty,
    selectedFile,
    selectFile,
    getFileContent,
    setFileContent,
    addFile,
    addBinaryFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    changes,
    clearChanges,
    isSaving,
    status,
    resultUrl,
    saveAllChanges
  ]);

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error('useFileSystem must be used within FileSystemProvider');
  return ctx;
}
