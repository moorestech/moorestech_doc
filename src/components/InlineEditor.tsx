import React, {useState, useEffect, useCallback} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from './InlineEditor.module.css';

interface InlineEditorProps {
  documentPath?: string;
  storageKey?: string;
}

export default function InlineEditor({ 
  documentPath = '', 
  storageKey = 'doc-inline-editor' 
}: InlineEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'markdown' | 'preview' | 'metadata'>('markdown');
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    lastModified: new Date().toISOString()
  });

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
    
    if (savedMetadata) {
      try {
        setMetadata(JSON.parse(savedMetadata));
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    } else {
      // ドキュメントパスからメタデータを推測
      const pathParts = documentPath.split('/').filter(Boolean);
      setMetadata({
        title: pathParts[pathParts.length - 1] || 'Untitled',
        description: `Documentation for ${documentPath}`,
        tags: pathParts.slice(0, -1),
        lastModified: new Date().toISOString()
      });
    }
  }, [documentPath, storageKey]);

  // コンテンツ保存処理
  const handleSave = useCallback(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    setIsSaving(true);
    const key = `${storageKey}-${documentPath}`;
    
    try {
      localStorage.setItem(key, content);
      localStorage.setItem(`${key}-metadata`, JSON.stringify({
        ...metadata,
        lastModified: new Date().toISOString()
      }));
      setLastSaved(new Date());
      
      // 保存成功をシミュレート
      setTimeout(() => {
        setIsSaving(false);
        console.log('✅ Document saved successfully!');
      }, 500);
    } catch (e) {
      console.error('Failed to save:', e);
      setIsSaving(false);
    }
  }, [content, metadata, documentPath, storageKey]);

  // 自動保存（3秒後）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && ExecutionEnvironment.canUseDOM) {
        handleSave();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [content, handleSave]);

  // キーボードショートカット
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S で保存
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape でエディタを閉じる
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!isOpen) {
    return (
      <button 
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        title="Open Editor"
      >
        ✏️ Edit
      </button>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.editor}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h3 className={styles.title}>📝 Document Editor</h3>
            <span className={styles.path}>{documentPath || '/unknown'}</span>
          </div>
          <div className={styles.headerRight}>
            {isSaving && <span className={styles.savingIndicator}>🔄 Saving...</span>}
            {lastSaved && !isSaving && (
              <span className={styles.savedIndicator}>
                ✅ Saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button 
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              title="Close Editor (Esc)"
            >
              ✖
            </button>
          </div>
        </div>
        
        {/* タブバー */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'markdown' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            📄 Markdown
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'preview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'metadata' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            🏷️ Metadata
          </button>
        </div>
        
        {/* コンテンツエリア */}
        <div className={styles.content}>
          {activeTab === 'markdown' && (
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your documentation here..."
              spellCheck={false}
            />
          )}
          
          {activeTab === 'preview' && (
            <div className={styles.preview}>
              <div className={styles.previewContent}>
                <h4>🎯 Preview Mode</h4>
                <p><em>(これはPoCのため、実際のマークダウンレンダリングはしません)</em></p>
                <div className={styles.previewBox}>
                  <pre>{content.slice(0, 500)}...</pre>
                </div>
                <p className={styles.stats}>
                  📊 Statistics: {content.split('\n').length} lines, {content.length} characters
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'metadata' && (
            <div className={styles.metadata}>
              <div className={styles.metadataForm}>
                <label className={styles.label}>
                  <span>🏷️ Title</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={metadata.title}
                    onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                    placeholder="Document title"
                  />
                </label>
                
                <label className={styles.label}>
                  <span>📝 Description</span>
                  <textarea
                    className={styles.metaTextarea}
                    value={metadata.description}
                    onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                    placeholder="Brief description of the document"
                    rows={3}
                  />
                </label>
                
                <label className={styles.label}>
                  <span>🏷️ Tags</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={metadata.tags.join(', ')}
                    onChange={(e) => setMetadata({...metadata, tags: e.target.value.split(',').map(t => t.trim())})}
                    placeholder="tag1, tag2, tag3"
                  />
                </label>
                
                <div className={styles.metaInfo}>
                  <span>📅 Last Modified: {new Date(metadata.lastModified).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* フッター */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className={styles.actionButton} onClick={handleSave}>
              💾 Save (Cmd+S)
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => {
                setContent('');
                setMetadata({...metadata, title: '', description: '', tags: []});
              }}
            >
              🗑️ Clear
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => {
                const key = `${storageKey}-${documentPath}`;
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${metadata.title || 'document'}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              📥 Export
            </button>
          </div>
          <div className={styles.footerRight}>
            <span className={styles.storageInfo}>
              💾 Storage: {storageKey}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}