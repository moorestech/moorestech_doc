import React from 'react';
import styles from './InlineEditor.module.css';
import {useGitHubContent} from './hooks/useGitHubContent';
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

  return (
    <div className={styles.editorContainer}>
      <EditorHeader 
        documentPath={documentPath}
      />
      
      <EditorContent 
        isLoading={isLoading}
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}