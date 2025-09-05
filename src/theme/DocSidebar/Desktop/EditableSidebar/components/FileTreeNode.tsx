import React from 'react';
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
    return (
      <div key={node.path} style={{ marginLeft: node.path === DOCS_ROOT ? 0 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button 
            onClick={() => { 
              onToggleExpand(node.path); 
              if (!node.loaded) onLoadChildren(node); 
            }} 
            title={isOpen ? '折りたたむ' : '展開'}
          >
            {isOpen ? '📂' : '📁'}
          </button>
          <span style={{ fontWeight: 600 }}>{node.name}</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => onAddFile(node.path)} title="ファイル追加">＋ファイル</button>
          <button onClick={() => onAddFolder(node.path)} title="フォルダ追加">＋フォルダ</button>
          <button onClick={() => onDeleteFolder(node.path, node)} title="フォルダ削除">🗑</button>
        </div>
        {isOpen && node.children && (
          <div>
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
    <div key={node.path} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 24 }}>
      <span>📄</span>
      <span>{node.name}</span>
      <span style={{ flex: 1 }} />
      <button onClick={() => onMoveFile(node.path)} title="移動/リネーム">↔︎</button>
      <button onClick={() => onDeleteFile(node.path)} title="削除">🗑</button>
    </div>
  );
};