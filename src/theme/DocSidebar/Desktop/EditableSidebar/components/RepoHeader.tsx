import React from 'react';
import styles from '../EditableSidebar.module.css';
import { Repository } from '../types';

interface RepoHeaderProps {
  repo: Repository;
  branch: string;
  onReload: () => Promise<void>;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ repo, branch, onReload }) => {
  return (
    <div className={styles.repoHeader}>
      <div className={styles.repoInfo}>
        <span className={styles.repoLabel}>Repo:</span>
        <span className={styles.repoName}>
          {repo.owner}/{repo.repo}@{branch}
        </span>
      </div>
      <button className={styles.reloadButton} onClick={onReload}>
        ↻ 再読み込み
      </button>
    </div>
  );
};