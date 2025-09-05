import React from 'react';
import styles from '../EditableSidebar.module.css';
import { Change } from '../types/editableSidebar';

interface ChangesPanelProps {
  changes: Change[];
  changesSummary: string;
  hasToken: boolean;
  onClearChanges: () => void;
  onApplyChanges: () => void;
}

export const ChangesPanel: React.FC<ChangesPanelProps> = ({
  changes,
  changesSummary,
  hasToken,
  onClearChanges,
  onApplyChanges,
}) => {
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--ifm-toc-border-color)', paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>ステージ済みの変更</span>
        <span style={{ color: 'var(--ifm-color-secondary-darkest)' }}>({changes.length})</span>
        <span style={{ flex: 1 }} />
        <button onClick={onClearChanges} disabled={changes.length === 0}>クリア</button>
        <button onClick={onApplyChanges} disabled={changes.length === 0 || !hasToken}>変更を適用</button>
      </div>
      {changes.length > 0 ? (
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{changesSummary}</pre>
      ) : (
        <div className={styles.placeholderDescription} style={{ marginTop: 8 }}>
          ここに追加・削除・移動の変更が表示されます。
        </div>
      )}
      {!hasToken && (
        <div className={styles.placeholderDescription} style={{ marginTop: 8, color: 'var(--ifm-color-danger)' }}>
          変更を適用するにはGitHubにログインしてください。
        </div>
      )}
    </div>
  );
};