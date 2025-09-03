import React from 'react';
import styles from '../InlineEditor.module.css';

interface EditorHeaderProps {
  documentPath: string;
  onExitEditMode: () => void;
}

/**
 * エディターのヘッダーコンポーネント
 */
export default function EditorHeader({ documentPath, onExitEditMode }: EditorHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <h3 className={styles.title}>📝 Document Editor</h3>
        <span className={styles.path}>{documentPath || '/unknown'}</span>
      </div>
      <div className={styles.headerRight}>
        <button 
          className={styles.exitButton}
          onClick={onExitEditMode}
          title="Exit Edit Mode"
        >
          👁️ View Mode
        </button>
      </div>
    </div>
  );
}