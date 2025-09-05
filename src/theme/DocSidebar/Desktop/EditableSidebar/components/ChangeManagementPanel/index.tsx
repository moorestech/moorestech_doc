import React, { useState } from 'react';
import styles from './styles.module.css';
import { Change } from '../../types';

interface ChangeManagementPanelProps {
  changes: Change[];
  onApplyChanges: () => Promise<void>;
  onClearChanges: () => void;
  isApplying?: boolean;
}

export const ChangeManagementPanel: React.FC<ChangeManagementPanelProps> = ({
  changes,
  onApplyChanges,
  onClearChanges,
  isApplying = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = changes.length > 0;

  const getChangeIcon = (kind: Change['kind']) => {
    switch (kind) {
      case 'addFile': return '➕';
      case 'updateFile': return '✏️';
      case 'deleteFile': return '🗑️';
      case 'moveFile': return '➡️';
      case 'addFolder': return '📁+';
      case 'deleteFolder': return '📁-';
      default: return '•';
    }
  };

  const getChangeDescription = (change: Change) => {
    switch (change.kind) {
      case 'addFile':
        return `ファイル追加: ${change.path}`;
      case 'updateFile':
        return `ファイル更新: ${change.path}`;
      case 'deleteFile':
        return `ファイル削除: ${change.path}`;
      case 'moveFile':
        return `移動: ${change.from} → ${change.to}`;
      case 'addFolder':
        return `フォルダ追加: ${change.path}`;
      case 'deleteFolder':
        return `フォルダ削除: ${change.path}`;
      default:
        return '';
    }
  };

  const handleApply = async () => {
    if (!hasChanges || isApplying) return;
    await onApplyChanges();
  };

  const handleClear = () => {
    if (!hasChanges) return;
    if (window.confirm('すべての変更を破棄しますか？')) {
      onClearChanges();
      setIsExpanded(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div 
        className={`${styles.header} ${hasChanges ? styles.hasChanges : ''}`}
        onClick={() => hasChanges && setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerContent}>
          <button 
            className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
            disabled={!hasChanges}
          >
            ▶
          </button>
          <span className={styles.title}>
            変更 {hasChanges && <span className={styles.badge}>{changes.length}</span>}
          </span>
        </div>
        {hasChanges && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={handleApply}
              disabled={isApplying}
              title="Pull Request を作成"
            >
              {isApplying ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  作成中...
                </>
              ) : (
                <>
                  📤 PR作成
                </>
              )}
            </button>
            <button 
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={handleClear}
              disabled={isApplying}
              title="すべての変更を破棄"
            >
              ✕ 破棄
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && hasChanges && (
        <div className={styles.content}>
          <div className={styles.changeList}>
            {changes.map((change, index) => (
              <div key={index} className={styles.changeItem}>
                <span className={styles.changeIcon}>
                  {getChangeIcon(change.kind)}
                </span>
                <span className={styles.changeDescription}>
                  {getChangeDescription(change)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
