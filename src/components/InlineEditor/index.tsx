import React, { useEffect } from 'react';
import styles from './InlineEditor.module.css';
import {useGitHubContent} from './hooks/useGitHubContent';
import { useEditState, useIsEditing } from '../../contexts/EditStateContext';
import EditorHeader from './components/EditorHeader';
import EditorContent from './components/EditorContent';
import ForkCreationModal from './components/ForkCreationModal';

interface InlineEditorProps {
  documentPath?: string;
  storageKey?: string;
  originalProps?: any;
}

/**
 * インラインドキュメントエディター
 * GitHubからコンテンツを取得して編集可能にする
 */
export default function InlineEditor({ 
  documentPath = '', 
  storageKey = 'doc-inline-editor',
  originalProps
}: InlineEditorProps) {
  const { enterEditMode } = useEditState();
  const isEditing = useIsEditing();
  
  // 編集パスを設定
  useEffect(() => {
    if (isEditing && documentPath) {
      enterEditMode(documentPath);
    }
  }, [isEditing, documentPath, enterEditMode]);
  
  // GitHubコンテンツの管理
  const {
    content,
    setContent,
    isLoading,
    repoInfo,
    isForkCreating,
    forkCreationMessage,
    forkCreationError,
    clearForkError
  } = useGitHubContent(documentPath);
  
  // 編集モードでない場合は非表示
  if (!isEditing) {
    return null;
  }

  return (
    <>
      <div className={styles.editorContainer}>
        <EditorHeader 
          documentPath={documentPath}
          repoInfo={repoInfo}
          content={content}
        />
        
        <EditorContent 
          isLoading={isLoading}
          content={content}
          onContentChange={setContent}
        />
      </div>
      
      <ForkCreationModal
        isOpen={isForkCreating}
        message={forkCreationMessage}
        error={forkCreationError}
        onClose={clearForkError}
      />
    </>
  );
}
