import React from 'react';
import styles from '../../InlineEditor.module.css';

interface HeaderTitleProps {
  documentPath: string;
}

export default function HeaderTitle({ documentPath }: HeaderTitleProps) {
  return (
    <>
      <h3 className={styles.title}>📝 Document Editor</h3>
      <span className={styles.path}>{documentPath || '/unknown'}</span>
    </>
  );
}