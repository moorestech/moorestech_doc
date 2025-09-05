import { FileNode, DirectoryNode, FileSystemNode, FileChange } from './types';

// パスをセグメントに分割
export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

// ノードを取得
export function getNodeByPath(root: DirectoryNode, path: string): FileSystemNode | undefined {
  if (!path || path === '/') return root;
  
  // ルートパスと同じ場合はルートを返す
  if (path === root.path) return root;
  
  // パスがルートパスで始まる場合、ルートパスを除去
  const normalizedPath = path.startsWith(root.path + '/') 
    ? path.substring(root.path.length + 1)
    : path.startsWith(root.path)
    ? path.substring(root.path.length).replace(/^\//, '')
    : path;
  
  const segments = splitPath(normalizedPath);
  let current: FileSystemNode = root;
  
  for (const segment of segments) {
    if (current.type !== 'directory') return undefined;
    const child = current.children.get(segment);
    if (!child) {
      // デバッグログ
      console.log('[getNodeByPath] Child not found:', { 
        segment, 
        availableChildren: Array.from(current.children.keys()),
        currentPath: current.path 
      });
      return undefined;
    }
    current = child;
  }
  
  return current;
}

// 親ディレクトリと名前を取得
export function getParentAndName(path: string): { parentPath: string; name: string } {
  const segments = splitPath(path);
  const name = segments.pop() || '';
  const parentPath = segments.join('/') || '/';
  return { parentPath, name };
}

// ノードを追加
export function addNode(root: DirectoryNode, parentPath: string, node: FileSystemNode): DirectoryNode {
  const newRoot = cloneDirectory(root);
  const parent = parentPath === '/' ? newRoot : getNodeByPath(newRoot, parentPath);
  
  if (parent?.type === 'directory') {
    parent.children.set(node.name, node);
  }
  
  return newRoot;
}

// ノードを削除
export function removeNode(root: DirectoryNode, path: string): DirectoryNode {
  if (path === '/') return root; // ルートは削除できない
  
  const newRoot = cloneDirectory(root);
  const { parentPath, name } = getParentAndName(path);
  const parent = parentPath === '/' ? newRoot : getNodeByPath(newRoot, parentPath);
  
  if (parent?.type === 'directory') {
    parent.children.delete(name);
  }
  
  return newRoot;
}

// ディレクトリを再帰的にクローン
export function cloneDirectory(dir: DirectoryNode): DirectoryNode {
  const cloned: DirectoryNode = {
    ...dir,
    children: new Map()
  };
  
  for (const [name, child] of dir.children) {
    if (child.type === 'directory') {
      cloned.children.set(name, cloneDirectory(child));
    } else {
      cloned.children.set(name, { ...child });
    }
  }
  
  return cloned;
}

// ファイル内容を更新
export function updateFileInTree(root: DirectoryNode, path: string, content: string): DirectoryNode {
  const newRoot = cloneDirectory(root);
  const node = getNodeByPath(newRoot, path);
  
  if (node?.type === 'file') {
    node.content = content;
    node.isModified = node.originalContent !== undefined && node.originalContent !== content;
  }
  
  return newRoot;
}

// 変更をマージして重複を除去
export function mergeChanges(changes: FileChange[]): FileChange[] {
  const changeMap = new Map<string, FileChange>();
  
  for (const change of changes) {
    const key = change.type === 'rename' ? change.oldPath : change.path;
    const existing = changeMap.get(key);
    
    if (existing) {
      // 既存の変更がある場合の処理
      if (existing.type === 'create' && change.type === 'modify') {
        // 新規作成後の変更は新規作成のまま
        changeMap.set(key, {
          ...existing,
          content: (change as any).content
        });
      } else if (existing.type === 'modify' && change.type === 'delete') {
        // 変更後の削除は削除のみ
        changeMap.delete(key);
        changeMap.set(key, change);
      } else {
        // その他の場合は最新の変更で上書き
        changeMap.set(key, change);
      }
    } else {
      changeMap.set(key, change);
    }
  }
  
  return Array.from(changeMap.values());
}

// すべてのノードを再帰的に収集
export function collectAllNodes(node: FileSystemNode, result: FileSystemNode[] = []): FileSystemNode[] {
  result.push(node);
  if (node.type === 'directory') {
    for (const child of node.children.values()) {
      collectAllNodes(child, result);
    }
  }
  return result;
}

// 削除予定のノードを収集
export function collectDeletedNodes(root: DirectoryNode): string[] {
  const deleted: string[] = [];
  const traverse = (node: FileSystemNode) => {
    if (node.isDeleted) {
      deleted.push(node.path);
    }
    if (node.type === 'directory' && !node.isDeleted) {
      for (const child of node.children.values()) {
        traverse(child);
      }
    }
  };
  traverse(root);
  return deleted;
}

// 変更されたファイルを収集
export function collectModifiedFiles(root: DirectoryNode): FileNode[] {
  const modified: FileNode[] = [];
  const traverse = (node: FileSystemNode) => {
    if (node.type === 'file' && node.isModified && !node.isDeleted) {
      modified.push(node);
    } else if (node.type === 'directory' && !node.isDeleted) {
      for (const child of node.children.values()) {
        traverse(child);
      }
    }
  };
  traverse(root);
  return modified;
}

// 新規作成されたノードを収集
export function collectNewNodes(root: DirectoryNode): FileSystemNode[] {
  const newNodes: FileSystemNode[] = [];
  const traverse = (node: FileSystemNode) => {
    if (node.isNew && !node.isDeleted) {
      newNodes.push(node);
    }
    if (node.type === 'directory' && !node.isDeleted) {
      for (const child of node.children.values()) {
        traverse(child);
      }
    }
  };
  traverse(root);
  return newNodes;
}