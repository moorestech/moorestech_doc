import React, { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styles from '../EditableSidebar.module.css';
import { FileSystemNode } from '../../../../../contexts/FileSystemContext';

const ItemTypes = {
  NODE: 'node',
};

interface DragItem {
  paths: string[];
}

interface FileTreeNodeProps {
  node: FileSystemNode;
  selectedPaths: Set<string>;
  onSelect: (path: string, isMultiSelect: boolean) => void;
  onToggleExpand: (path: string) => void;
  onLoadChildren: (path: string) => void;
  onAddFile: (dirPath: string) => void;
  onAddFolder: (dirPath: string) => void;
  onDelete: (path: string) => void;
  onRename: (path: string) => void;
  onMoveItems: (sourcePaths: string[], targetPath: string) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  selectedPaths,
  onSelect,
  onToggleExpand,
  onLoadChildren,
  onAddFile,
  onAddFolder,
  onDelete,
  onRename,
  onMoveItems,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isSelected = selectedPaths.has(node.path);
  
  // ドラッグ設定
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: () => {
      if (isSelected && selectedPaths.size > 0) {
        return { paths: Array.from(selectedPaths) };
      }
      return { paths: [node.path] };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [node.path, isSelected, selectedPaths]);
  
  // ドロップ設定（ディレクトリのみ）
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    canDrop: (item: DragItem) => {
      if (node.type !== 'directory') return false;
      
      // 自分自身や子ディレクトリへのドロップを防ぐ
      return !item.paths.some(path => 
        node.path === path || 
        node.path.startsWith(path + '/')
      );
    },
    drop: (item: DragItem) => {
      onMoveItems(item.paths, node.path);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [node.path, node.type, onMoveItems]);
  
  // クリックハンドラー
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.ctrlKey || e.metaKey;
    onSelect(node.path, isMultiSelect);
  }, [node.path, onSelect]);
  
  // 展開ハンドラー
  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.path);
    if (node.type === 'directory' && node.children && node.children.size === 0) {
      onLoadChildren(node.path);
    }
  }, [node.path, node.type, node.type === 'directory' ? node.children : undefined, onToggleExpand, onLoadChildren]);
  
  // リネームハンドラー
  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(node.path);
  }, [node.path, onRename]);
  
  // 削除ハンドラー
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`${node.name} を削除しますか？`)) {
      onDelete(node.path);
    }
  }, [node.name, node.path, onDelete]);
  
  // ドラッグ&ドロップの参照を結合
  if (node.type === 'directory') {
    drag(drop(ref));
  } else {
    drag(ref);
  }
  
  if (node.type === 'directory') {
    const isExpanded = node.isExpanded;
    const isEmpty = node.children.size === 0;
    const isRoot = node.path === 'docs';
    const isDeleted = node.isDeleted;
    
    return (
      <div 
        className={styles.treeNode} 
        ref={ref}
        style={{ opacity: isDeleted ? 0.5 : (isDragging ? 0.5 : 1) }}
      >
        <div 
          className={`${styles.nodeContent} ${isSelected ? styles.selected : ''} ${isOver && canDrop ? styles.dropTarget : ''}`}
          onClick={handleClick}
        >
          <button 
            className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
            onClick={handleExpand}
            title={isExpanded ? '折りたたむ' : '展開'}
          >
            ▶
          </button>
          <span className={styles.nodeIcon}>
            {isExpanded ? '📂' : '📁'}
          </span>
          <span className={`${styles.nodeName} ${styles.dirName}`}>
            {node.name}
            {node.isNew && ' (新規)'}
            {node.isDeleted && ' (削除予定)'}
          </span>
          {!isDeleted && (
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
                <>
                  <button 
                    className={styles.actionButton}
                    onClick={handleRename}
                    title="リネーム"
                  >
                    ✏️
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={handleDelete}
                    title="削除"
                  >
                    🗑
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {isExpanded && !isEmpty && (
          <div className={styles.childrenContainer}>
            {Array.from(node.children.values()).map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                selectedPaths={selectedPaths}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onLoadChildren={onLoadChildren}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDelete={onDelete}
                onRename={onRename}
                onMoveItems={onMoveItems}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // ファイルノード
  const isDeleted = node.isDeleted;
  const isModified = node.isModified;
  
  return (
    <div 
      className={styles.treeNode} 
      ref={ref}
      style={{ opacity: isDeleted ? 0.5 : (isDragging ? 0.5 : 1) }}
    >
      <div 
        className={`${styles.nodeContent} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
      >
        <span style={{ width: 16 }}></span>
        <span className={styles.nodeIcon}>📄</span>
        <span className={styles.nodeName}>
          {node.name}
          {node.isNew && ' (新規)'}
          {isModified && ' (変更)'}
          {isDeleted && ' (削除予定)'}
        </span>
        {!isDeleted && (
          <div className={styles.nodeActions}>
            <button 
              className={styles.actionButton}
              onClick={handleRename}
              title="リネーム"
            >
              ✏️
            </button>
            <button 
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={handleDelete}
              title="削除"
            >
              🗑
            </button>
          </div>
        )}
      </div>
    </div>
  );
};