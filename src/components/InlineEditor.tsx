import React, {useState, useEffect, useCallback} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {useHistory} from '@docusaurus/router';
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
  const [content, setContent] = useState('');

  // localStorageから初期値を読み込み
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const key = `${storageKey}-${documentPath}`;
    const savedContent = localStorage.getItem(key);
    const savedMetadata = localStorage.getItem(`${key}-metadata`);
    
    if (savedContent) {
      setContent(savedContent);
    } else {
      // サンプルコンテンツを設定
      const sampleContent = `# ${documentPath}

## 概要
このドキュメントは${documentPath}に関する情報を提供します。

## 主な機能
- 機能1
- 機能2
- 機能3

## コードサンプル
\`\`\`typescript
function example() {
  console.log('サンプルコード');
}
\`\`\`

## 参考リンク
- [Docusaurus](https://docusaurus.io)
- [GitHub](https://github.com)`;
      setContent(sampleContent);
    }
    
  }, [documentPath, storageKey]);


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
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your documentation here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}