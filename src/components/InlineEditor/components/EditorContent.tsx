import React from 'react';
import styles from '../InlineEditor.module.css';

interface EditorContentProps {
  isLoading: boolean;
  content: string;
  onContentChange: (newContent: string) => void;
}

/**
 * エディターのコンテンツエリアコンポーネント
 */
export default function EditorContent({ isLoading, content, onContentChange }: EditorContentProps) {
  return (
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
          onChange={(e) => onContentChange(e.target.value)}
          placeholder=""
          spellCheck={false}
        />
      )}
    </div>
  );
}