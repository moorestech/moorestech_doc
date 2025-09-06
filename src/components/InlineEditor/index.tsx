import React, { useEffect, useRef, useState } from 'react';
import styles from './InlineEditor.module.css';
import { useEditState, useIsEditing } from '../../contexts/EditStateContext';
import EditorHeader from './components/EditorHeader';
import EditorContent from './components/EditorContent';
import { useFileSystem } from '@site/src/contexts/FileSystemContext';
import { normalizeDocPath } from '@site/src/utils/github';
import { useImageUpload } from './hooks/useImageUpload';

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
  const { selectedFile, selectFile, getFileContent, setFileContent, addFile, addBinaryFile } = useFileSystem();

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
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLoadTokenRef = useRef<number>(0);
  const userEditedSinceLoadRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedFile) { 
        setIsLoading(false); 
        return; 
      }
      setIsLoading(true);
      setError(null);
      // New load cycle
      const myToken = ++currentLoadTokenRef.current;
      userEditedSinceLoadRef.current = false;
      try {
        console.log('[InlineEditor] Loading content for:', selectedFile);
        const txt = await getFileContent(selectedFile);
        if (!mounted) return;
        // Only set if this is the latest load and user hasn't edited meanwhile
        if (currentLoadTokenRef.current === myToken && !userEditedSinceLoadRef.current) {
          setContentLocal(txt);
        }
        console.log('[InlineEditor] Content loaded successfully');
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました';
        console.error('[InlineEditor] Error loading content:', errorMessage);
        setError(errorMessage);
        setContentLocal('');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedFile, getFileContent]);

  const handleContentChange = (newContent: string) => {
    userEditedSinceLoadRef.current = true;
    setContentLocal(newContent);
    if (selectedFile) setFileContent(selectedFile, newContent);
  };

  // Image upload (paste/drag&drop) handlers via hook
  const { handlePaste, handleDrop, handleDragOver } = useImageUpload({
    content,
    setContent: handleContentChange,
    textareaRef,
    addFile,
    addBinaryFile,
  });
  
  // 編集モードでない場合は非表示
  if (!isEditing) {
    return null;
  }

  return (
    <div className={styles.editorContainer}>
      <EditorHeader documentPath={documentPath} />
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          margin: '8px 0',
          color: '#c00'
        }}>
          <strong>エラー:</strong> {error}
        </div>
      )}
      
      <EditorContent 
        isLoading={isLoading}
        content={content}
        onContentChange={handleContentChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        textareaRef={textareaRef}
      />
    </div>
  );
}
