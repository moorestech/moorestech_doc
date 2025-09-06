import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import type { Change } from '../theme/DocSidebar/Desktop/EditableSidebar/types';

interface EditState {
  isEditing: boolean;
  editingPath: string | null;
  sidebarChanges: Change[];
}

interface EditStateContextType {
  editState: EditState;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
  enterEditMode: (path?: string) => void;
  exitEditMode: () => void;
  updateSidebarChanges: (changes: Change[]) => void;
  clearSidebarChanges: () => void;
}

const EditStateContext = createContext<EditStateContextType | undefined>(undefined);

const initialState: EditState = {
  isEditing: false,
  editingPath: null,
  sidebarChanges: [],
};

export function EditStateProvider({ children }: { children: ReactNode }) {
  const [editState, setEditState] = useState<EditState>(initialState);
  
  const enterEditMode = useCallback((path?: string) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    console.log('[EditStateContext] enterEditMode called with path:', path);
    setEditState(prev => {
      const newState = {
        ...prev,
        isEditing: true,
        editingPath: path || prev.editingPath,
      };
      console.log('[EditStateContext] State updated to:', newState);
      return newState;
    });
  }, []);
  
  const exitEditMode = useCallback(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    setEditState(prev => ({
      ...prev,
      isEditing: false,
      editingPath: null,
      // サイドバーの変更は保持（ユーザーが明示的にクリアするまで）
    }));
  }, []);
  
  const updateSidebarChanges = useCallback((changes: Change[]) => {
    setEditState(prev => ({
      ...prev,
      sidebarChanges: changes,
    }));
  }, []);
  
  const clearSidebarChanges = useCallback(() => {
    setEditState(prev => ({
      ...prev,
      sidebarChanges: [],
    }));
  }, []);
  
  const value: EditStateContextType = {
    editState,
    setEditState,
    enterEditMode,
    exitEditMode,
    updateSidebarChanges,
    clearSidebarChanges,
  };
  
  return <EditStateContext.Provider value={value}>{children}</EditStateContext.Provider>;
}

export function useEditState() {
  const context = useContext(EditStateContext);
  if (context === undefined) {
    throw new Error('useEditState must be used within an EditStateProvider');
  }
  return context;
}

// 便利なヘルパーhooks
export function useIsEditing() {
  const { editState } = useEditState();
  console.log('[EditStateContext] useIsEditing returns:', editState.isEditing);
  return editState.isEditing;
}

export function useEditingPath() {
  const { editState } = useEditState();
  return editState.editingPath;
}

export function useSidebarChanges() {
  const { editState } = useEditState();
  return editState.sidebarChanges;
}