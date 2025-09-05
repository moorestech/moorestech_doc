import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styles from '../EditableSidebar.module.css';
import { TreeNode, DOCS_ROOT } from '../types';

const ItemTypes = {
  NODE: 'node',
};

interface DragItem {
  paths: string[];
  nodes: { path: string; type: 'file' | 'dir' }[];
}

interface FileTreeNodeProps {
  node: TreeNode;
  expanded: Set<string>;
  selectedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onLoadChildren: (node: TreeNode) => Promise<void>;
  onAddFile: (dirPath: string) => void;
  onAddFolder: (dirPath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onDeleteFolder: (dirPath: string, node: TreeNode) => void;
  onMoveFile: (filePath: string) => void;
  onMoveItems: (items: { path: string; type: 'file' | 'dir' }[], targetPath: string) => void;
  onToggleSelection: (path: string, isMultiSelect: boolean) => void;
  isSelected: (path: string) => boolean;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  expanded,
  selectedPaths,
  onToggleExpand,
  onLoadChildren,
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onMoveFile,
  onMoveItems,
  onToggleSelection,
  isSelected,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const selected = isSelected(node.path);
  
  // Setup drag
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: () => {
      // If dragging a selected item, drag all selected items
      if (selected && selectedPaths.size > 0) {
        const selectedNodes = Array.from(selectedPaths).map(path => ({
          path,
          type: (path.endsWith('/') ? 'dir' : 'file') as 'file' | 'dir'
        }));
        return { 
          paths: Array.from(selectedPaths), 
          nodes: selectedNodes 
        };
      }
      // Otherwise, just drag this item
      return { 
        paths: [node.path], 
        nodes: [{ path: node.path, type: node.type }]
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [node.path, node.type, selected, selectedPaths]);
  
  // Setup drop (only for directories)
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    canDrop: (item: DragItem) => {
      // Can only drop into directories
      if (node.type !== 'dir') return false;
      
      // Cannot drop item into itself or its children
      return !item.paths.some(path => 
        node.path === path || 
        node.path.startsWith(path + '/')
      );
    },
    drop: (item: DragItem) => {
      onMoveItems(item.nodes, node.path);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [node.path, node.type, onMoveItems]);
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.ctrlKey || e.metaKey;
    onToggleSelection(node.path, isMultiSelect);
  };
  // Combine drag and drop refs for directories
  if (node.type === 'dir') {
    drag(drop(ref));
  } else {
    drag(ref);
  }
  
  if (node.type === 'dir') {
    const isOpen = expanded.has(node.path);
    const isRoot = node.path === DOCS_ROOT;
    
    return (
      <div className={styles.treeNode} ref={ref}>
        <div 
          className={`${styles.nodeContent} ${selected ? styles.selected : ''} ${isOver && canDrop ? styles.dropTarget : ''}`}
          onClick={handleClick}
          style={{ opacity: isDragging ? 0.5 : 1 }}
        >
          <button 
            className={`${styles.expandIcon} ${isOpen ? styles.expanded : ''}`}
            onClick={(e) => { 
              e.stopPropagation();
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
                selectedPaths={selectedPaths}
                onToggleExpand={onToggleExpand}
                onLoadChildren={onLoadChildren}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
                onMoveFile={onMoveFile}
                onMoveItems={onMoveItems}
                onToggleSelection={onToggleSelection}
                isSelected={isSelected}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // file node
  return (
    <div className={styles.treeNode} ref={ref}>
      <div 
        className={`${styles.nodeContent} ${selected ? styles.selected : ''}`}
        onClick={handleClick}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
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