import React from 'react';
import styles from '../../InlineEditor.module.css';

interface RepoIndicatorProps {
  repoInfo?: { owner: string; repo: string } | null;
}

export default function RepoIndicator({ repoInfo }: RepoIndicatorProps) {
  if (!repoInfo) return null;

  return (
    <span className={styles.repoIndicator}>
      {repoInfo.owner === 'moorestech' ? (
        <>
          <span className={styles.repoIcon}>📚</span>
          <span className={styles.repoText}>Original</span>
        </>
      ) : (
        <>
          <span className={styles.repoIcon}>🍴</span>
          <span className={styles.repoText}>Fork: {repoInfo.owner}/{repoInfo.repo}</span>
        </>
      )}
    </span>
  );
}