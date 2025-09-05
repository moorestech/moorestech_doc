import React, { useEffect, useState, useCallback } from 'react';
import styles from './InlineEditor.module.css';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useIsEditing } from '../../contexts/EditStateContext';

interface InlineEditorProps {
  documentPath?: string;
}

/**
 * インラインドキュメントエディター
 * FileSystemContextから選択されたファイルを編集
 */
export default function InlineEditor({ documentPath }: InlineEditorProps) {
  const isEditing = useIsEditing();
  
  console.log('[InlineEditor] Component mounted, isEditing:', isEditing, 'documentPath:', documentPath);
  
  const {
    fileSystem,
    updateFileContent,
    loadFromGitHub,
    selectFile,
    getNode
  } = useFileSystem();
  
  const [localContent, setLocalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 選択されたファイルのパス（documentPathから適切なファイルパスに変換）
  const convertedPath = documentPath?.startsWith('/docs/') 
    ? `docs/${documentPath.replace('/docs/', '')}.md`
    : documentPath?.replace(/^\//, '');
  
  const selectedPath = fileSystem.selectedFile || convertedPath;
  
  // 選択されたファイルのノード
  const selectedNode = selectedPath ? getNode(selectedPath) : null;
  
  console.log('[InlineEditor] Path conversion:', { 
    documentPath, 
    convertedPath, 
    selectedPath, 
    nodeFound: !!selectedNode 
  });
  
  // ファイル選択時の処理
  useEffect(() => {
    if (!selectedPath || !isEditing) return;
    
    // ファイルノードを取得
    const node = getNode(selectedPath);
    if (!node || node.type !== 'file') {
      setLocalContent('');
      return;
    }
    
    // コンテンツが空の場合はGitHubから読み込み
    if (!node.content && !node.isNew) {
      setIsLoading(true);
      loadFromGitHub(selectedPath).then(() => {
        const updatedNode = getNode(selectedPath);
        if (updatedNode?.type === 'file') {
          setLocalContent(updatedNode.content);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setLocalContent(node.content);
    }
  }, [selectedPath, isEditing, getNode, loadFromGitHub]);
  
  // コンテンツ変更ハンドラー
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    if (selectedPath) {
      updateFileContent(selectedPath, newContent);
    }
  }, [selectedPath, updateFileContent]);
  
  // 編集モードでない場合は非表示
  if (!isEditing || !selectedPath || !selectedNode) {
    console.log('[InlineEditor] Not rendering because:', {
      isEditing,
      selectedPath,
      selectedNode: !!selectedNode
    });
    return null;
  }
  
  console.log('[InlineEditor] Rendering with selectedNode:', selectedNode);
  
  return (
    <div className={styles.editorContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>ファイルエディター</span>
          <span className={styles.path}>{selectedPath}</span>
        </div>
        <div className={styles.headerRight}>
          {selectedNode.isNew && (
            <span className={styles.badge}>新規</span>
          )}
          {selectedNode.type === 'file' && selectedNode.isModified && (
            <span className={styles.badge}>変更</span>
          )}
          {selectedNode.type === 'file' && selectedNode.isDeleted && (
            <span className={styles.badge}>削除予定</span>
          )}
        </div>
      </div>
      
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}>🔄</div>
            <p>ファイルを読み込み中...</p>
          </div>
        ) : (
          <textarea
            className={styles.textarea}
            value={localContent}
            onChange={handleContentChange}
            placeholder="ここにコンテンツを入力..."
            spellCheck={false}
            disabled={selectedNode.type === 'file' && selectedNode.isDeleted}
          />
        )}
      </div>
      
      {selectedNode.type === 'file' && selectedNode.originalContent !== undefined && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {localContent === selectedNode.originalContent 
              ? '変更なし' 
              : `変更あり (${localContent.length - selectedNode.originalContent.length} 文字の差)`
            }
          </span>
        </div>
      )}
    </div>
  );
}