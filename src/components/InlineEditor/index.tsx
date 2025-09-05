import React, { useEffect, useState } from 'react';
import styles from './InlineEditor.module.css';
import { useEditState, useIsEditing } from '../../contexts/EditStateContext';
import EditorHeader from './components/EditorHeader';
import EditorContent from './components/EditorContent';
import ForkCreationModal from './components/ForkCreationModal';
import { useFileSystem } from '@site/src/contexts/FileSystemContext';
import { normalizeDocPath } from '@site/src/utils/github';

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
  const { repo, loading, selectedFile, selectFile, getFileContent, setFileContent, status } = useFileSystem();

  // 編集パスを設定 + FS選択
  useEffect(() => {
    if (isEditing && documentPath) {
      enterEditMode(documentPath);
      const normalized = normalizeDocPath(documentPath);
      selectFile(normalized);
    }
  }, [isEditing, documentPath, enterEditMode, selectFile]);

  const [content, setContentLocal] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedFile) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const txt = await getFileContent(selectedFile);
        if (!mounted) return;
        setContentLocal(txt);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedFile, getFileContent]);

  const handleContentChange = (newContent: string) => {
    setContentLocal(newContent);
    if (selectedFile) setFileContent(selectedFile, newContent);
  };
  
  // 編集モードでない場合は非表示
  if (!isEditing) {
    return null;
  }

  return (
    <>
      <div className={styles.editorContainer}>
        <EditorHeader documentPath={documentPath} />
        
        <EditorContent 
          isLoading={isLoading}
          content={content}
          onContentChange={handleContentChange}
        />
      </div>
      
      <ForkCreationModal
        isOpen={false}
        message={''}
        error={null}
        onClose={() => {}}
      />
    </>
  );
}
