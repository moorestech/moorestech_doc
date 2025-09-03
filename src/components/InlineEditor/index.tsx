import React from 'react';
import styles from './InlineEditor.module.css';
import {useGitHubContent} from './hooks/useGitHubContent';
import {useEditMode} from './hooks/useEditMode';
import EditorHeader from './components/EditorHeader';
import EditorContent from './components/EditorContent';

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
  // GitHubコンテンツの管理
  const {content, setContent, isLoading} = useGitHubContent(documentPath);
  
  // 編集モードの管理
  const {exitEditMode} = useEditMode(documentPath);

  return (
    <div className={styles.editorContainer}>
      <EditorHeader 
        documentPath={documentPath}
        onExitEditMode={exitEditMode}
      />
      
      <EditorContent 
        isLoading={isLoading}
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}