import React from 'react';
import styles from './EditableSidebar.module.css';

interface EditableSidebarProps {
  items: any[];
  path: string;
}

export default function EditableSidebar({ items, path }: EditableSidebarProps) {
  return (
    <div className={styles.editableSidebar}>
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>📝</div>
        <div className={styles.placeholderText}>
          編集用サイドバー
        </div>
        <div className={styles.placeholderDescription}>
          ここに編集機能が表示されます
        </div>
      </div>
    </div>
  );
}