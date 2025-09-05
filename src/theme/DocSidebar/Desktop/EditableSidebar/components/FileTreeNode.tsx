import React from 'react';
import styles from '../EditableSidebar.module.css';
import { TreeNode, DOCS_ROOT } from '../types';

interface FileTreeNodeProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggleExpand: (path: string) => void;
  onLoadChildren: (node: TreeNode) => Promise<void>;
  onAddFile: (dirPath: string) => void;
  onAddFolder: (dirPath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onDeleteFolder: (dirPath: string, node: TreeNode) => void;
  onMoveFile: (filePath: string) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  expanded,
  onToggleExpand,
  onLoadChildren,
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onMoveFile,
}) => {
  if (node.type === 'dir') {
    const isOpen = expanded.has(node.path);
    const isRoot = node.path === DOCS_ROOT;
    
    return (
      <div className={styles.treeNode}>
        <div className={styles.nodeContent}>
          <button 
            className={`${styles.expandIcon} ${isOpen ? styles.expanded : ''}`}
            onClick={() => { 
              onToggleExpand(node.path); 
              if (!node.loaded) onLoadChildren(node); 
            }} 
            title={isOpen ? '折りたたむ' : '展開'}
          >
            ▶
          </button>
          <span className={styles.nodeIcon}>
            {isOpen ? '📂' : '📁'}
          </span>
          <span className={`${styles.nodeName} ${styles.dirName}`}>
            {node.name}
          </span>
          <div className={styles.nodeActions}>
            <button 
              className={styles.actionButton} 
              onClick={(e) => { e.stopPropagation(); onAddFile(node.path); }}
              title="ファイル追加"
            >
              ＋ファイル
            </button>
            <button 
              className={styles.actionButton} 
              onClick={(e) => { e.stopPropagation(); onAddFolder(node.path); }}
              title="フォルダ追加"
            >
              ＋フォルダ
            </button>
            {!isRoot && (
              <button 
                className={`${styles.actionButton} ${styles.danger}`}
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(node.path, node); }}
                title="フォルダ削除"
              >
                🗑
              </button>
            )}
          </div>
        </div>
        {isOpen && node.children && (
          <div className={styles.childrenContainer}>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                onLoadChildren={onLoadChildren}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
                onMoveFile={onMoveFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // file node
  return (
    <div className={styles.treeNode}>
      <div className={styles.nodeContent}>
        <span style={{ width: 16 }}></span>
        <span className={styles.nodeIcon}>📄</span>
        <span className={styles.nodeName}>{node.name}</span>
        <div className={styles.nodeActions}>
          <button 
            className={styles.actionButton}
            onClick={(e) => { e.stopPropagation(); onMoveFile(node.path); }}
            title="移動/リネーム"
          >
            ↔︎
          </button>
          <button 
            className={`${styles.actionButton} ${styles.danger}`}
            onClick={(e) => { e.stopPropagation(); onDeleteFile(node.path); }}
            title="削除"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
};