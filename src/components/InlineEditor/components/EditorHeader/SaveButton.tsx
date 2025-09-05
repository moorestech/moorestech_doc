import React from 'react';
import styles from '../../InlineEditor.module.css';

interface SaveButtonProps {
  onSaveClick: () => Promise<void>;
  isSaving: boolean;
}

export default function SaveButton({ onSaveClick, isSaving }: SaveButtonProps) {
  return (
    <button 
      className={styles.exitButton}
      onClick={onSaveClick}
      title="Save & Create PR"
      disabled={isSaving}
    >
      {isSaving ? '⏳ Saving...' : '💾 Save & PR'}
    </button>
  );
}