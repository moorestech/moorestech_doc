import React, {useState, useEffect, useCallback} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {useHistory} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './InlineEditor.module.css';

interface InlineEditorProps {
  documentPath?: string;
  storageKey?: string;
  originalProps?: any;
}

export default function InlineEditor({ 
  documentPath = '', 
  storageKey = 'doc-inline-editor',
  originalProps
}: InlineEditorProps) {
  const history = useHistory();
  const {siteConfig} = useDocusaurusContext();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 初期ロード時にGitHubからデータを取得
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || !documentPath) return;
    
    const fetchContent = async () => {
      setIsLoading(true);
      
      try {
        // ドキュメントパスから実際のファイルパスを構築
        // /docs/intro -> docs/intro.md
        const cleanPath = documentPath.replace(/^\//, '');
        const filePath = cleanPath.endsWith('.md') ? cleanPath : `${cleanPath}.md`;
        
        // GitHub Raw URLを構築
        const githubBaseUrl = (siteConfig.customFields?.githubEditUrl as string) || 'https://github.com/moorestech/moorestech_doc/tree/master';
        const rawUrl = githubBaseUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/')
          + '/' + filePath;
        
        console.log('Fetching from GitHub:', rawUrl);
        
        const response = await fetch(rawUrl);
        
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          // ファイルが見つからない場合も空のコンテンツを設定
          setContent('');
          if (response.status !== 404) {
            console.warn(`Failed to fetch content: ${response.statusText}`);
          }
        }
      } catch (err) {
        console.error('Error fetching GitHub content:', err);
        // エラー時も空のコンテンツを設定
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [documentPath, siteConfig]);


  // 編集モードを終了
  const exitEditMode = useCallback(() => {
    // URLから?edit=trueを削除
    history.push(documentPath);
  }, [documentPath, history]);

  // キーボードショートカット
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape で編集モード終了
      if (e.key === 'Escape') {
        exitEditMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitEditMode]);

  return (
    <div className={styles.editorContainer}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>📝 Document Editor</h3>
          <span className={styles.path}>{documentPath || '/unknown'}</span>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.exitButton}
            onClick={exitEditMode}
            title="Exit Edit Mode (Esc)"
          >
            👁️ View Mode
          </button>
        </div>
      </div>
      
      {/* コンテンツエリア */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}>🔄</div>
            <p>Loading content from GitHub...</p>
          </div>
        ) : (
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder=""
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}