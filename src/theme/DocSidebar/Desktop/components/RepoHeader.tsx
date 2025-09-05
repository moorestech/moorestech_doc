import React from 'react';
import { Repository, TreeNode, DOCS_ROOT } from '../types/editableSidebar';

interface RepoHeaderProps {
  repo: Repository;
  branch: string;
  onReload: () => Promise<void>;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ repo, branch, onReload }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontWeight: 600 }}>Repo:</span>
      <span>{repo.owner}/{repo.repo}@{branch}</span>
      <span style={{ flex: 1 }} />
      <button onClick={onReload}>
        再読み込み
      </button>
    </div>
  );
};