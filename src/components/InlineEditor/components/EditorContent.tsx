import React from 'react';
import styles from '../InlineEditor.module.css';

interface EditorContentProps {
  isLoading: boolean;
  content: string;
  onContentChange: (newContent: string) => void;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  onDrop?: React.DragEventHandler<HTMLTextAreaElement>;
  onDragOver?: React.DragEventHandler<HTMLTextAreaElement>;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

/**
 * エディターのコンテンツエリアコンポーネント
 */
export default function EditorContent({ isLoading, content, onContentChange, onPaste, onDrop, onDragOver, textareaRef }: EditorContentProps) {
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
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={onDragOver}
          ref={textareaRef}
          placeholder=""
          spellCheck={false}
        />
      )}
    </div>
  );
}
