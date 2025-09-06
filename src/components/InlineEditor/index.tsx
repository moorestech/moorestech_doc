import React, { useEffect, useRef, useState } from 'react';
import styles from './InlineEditor.module.css';
import { useEditState, useIsEditing } from '../../contexts/EditStateContext';
import EditorHeader from './components/EditorHeader';
import EditorContent from './components/EditorContent';
import { useFileSystem } from '@site/src/contexts/FileSystemContext';
import { normalizeDocPath } from '@site/src/utils/github';

interface InlineEditorProps {
  documentPath?: string;
  storageKey?: string;
  originalProps?: any;
}

/**
 * インラインドキュメントエディター
 * GitHubからコンテンツを取得して編集可能にする
 */
export default function InlineEditor({ 
  documentPath = '', 
  storageKey = 'doc-inline-editor',
  originalProps
}: InlineEditorProps) {
  const { enterEditMode } = useEditState();
  const isEditing = useIsEditing();
  const { repo, loading, selectedFile, selectFile, getFileContent, setFileContent, status, addFile, addBinaryFile } = useFileSystem();

  // 編集パスを設定 + FS選択
  useEffect(() => {
    if (isEditing && documentPath) {
      enterEditMode(documentPath);
      const normalized = normalizeDocPath(documentPath);
      selectFile(normalized);
    }
  }, [isEditing, documentPath, enterEditMode, selectFile]);

  const [content, setContentLocal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLoadTokenRef = useRef<number>(0);
  const userEditedSinceLoadRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedFile) { 
        setIsLoading(false); 
        return; 
      }
      setIsLoading(true);
      setError(null);
      // New load cycle
      const myToken = ++currentLoadTokenRef.current;
      userEditedSinceLoadRef.current = false;
      try {
        console.log('[InlineEditor] Loading content for:', selectedFile);
        const txt = await getFileContent(selectedFile);
        if (!mounted) return;
        // Only set if this is the latest load and user hasn't edited meanwhile
        if (currentLoadTokenRef.current === myToken && !userEditedSinceLoadRef.current) {
          setContentLocal(txt);
        }
        console.log('[InlineEditor] Content loaded successfully');
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました';
        console.error('[InlineEditor] Error loading content:', errorMessage);
        setError(errorMessage);
        setContentLocal('');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedFile, getFileContent]);

  const handleContentChange = (newContent: string) => {
    userEditedSinceLoadRef.current = true;
    setContentLocal(newContent);
    if (selectedFile) setFileContent(selectedFile, newContent);
  };

  // --- Image upload helpers (paste/drag&drop) ---
  const bytesToBase64 = (buf: ArrayBuffer): string => {
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack overflow
    for (let i = 0; i < bytes.length; i += chunkSize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slice = bytes.subarray(i, i + chunkSize) as any;
      binary += String.fromCharCode.apply(null, slice);
    }
    // eslint-disable-next-line no-undef
    return (typeof window !== 'undefined' && (window as any).btoa) ? (window as any).btoa(binary) : Buffer.from(bytes).toString('base64');
  };

  const sha256Hex = async (buf: ArrayBuffer): Promise<string> => {
    // eslint-disable-next-line no-undef
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const arr = Array.from(new Uint8Array(digest));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const extFromMime = (mime: string, fallbackName?: string): string => {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
      'image/x-icon': '.ico',
      'image/vnd.microsoft.icon': '.ico',
      'image/heic': '.heic',
      'image/heif': '.heif',
      'image/avif': '.avif',
    };
    if (map[mime]) return map[mime];
    if (fallbackName && /\.[a-z0-9]+$/i.test(fallbackName)) {
      return fallbackName.slice(fallbackName.lastIndexOf('.'));
    }
    return '';
  };

  const insertAtPosition = (text: string, start: number, end: number) => {
    const el = textareaRef.current;
    const s = Math.max(0, Math.min(start ?? 0, content.length));
    const e = Math.max(s, Math.min(end ?? s, content.length));
    const before = content.slice(0, s);
    const after = content.slice(e);
    const next = before + text + after;
    handleContentChange(next);
    // Restore caret after inserted text
    if (el) {
      const pos = s + text.length;
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      }, 0);
    }
  };

  const processImageFiles = async (files: File[], at?: { start: number; end: number }) => {
    const editorDir = 'static/EditorUpload';
    const markdowns: string[] = [];
    for (const file of files) {
      if (!file.type || !file.type.startsWith('image/')) continue;
      const buf = await file.arrayBuffer();
      const hash = await sha256Hex(buf);
      const ext = extFromMime(file.type, file.name);
      if (!ext) {
        console.warn('[InlineEditor] Unsupported image type:', file.type);
        continue;
      }
      const name = `${hash}${ext}`;
      const repoPath = `${editorDir}/${name}`;
      const publicPath = `/EditorUpload/${name}`;
      const base64 = bytesToBase64(buf);
      try {
        // Stage as binary base64
        if (addBinaryFile) {
          addBinaryFile(repoPath, base64);
        } else {
          // Fallback to extended addFile signature
          // @ts-ignore
          addFile(repoPath, base64, 'base64');
        }
        markdowns.push(`![](${publicPath})`);
      } catch (e) {
        console.error('[InlineEditor] Failed to stage image:', e);
      }
    }
    if (markdowns.length > 0) {
      const insertCore = markdowns.join('\n');
      const startPos = at?.start ?? (textareaRef.current?.selectionStart ?? content.length);
      const endPos = at?.end ?? (textareaRef.current?.selectionEnd ?? startPos);
      const needsLeadingNewline = startPos > 0 && content[startPos - 1] !== '\n';
      const insert = (needsLeadingNewline ? '\n' : '') + insertCore;
      insertAtPosition(insert, startPos, endPos);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = async (e) => {
    // Capture caret position before any async work
    const el = textareaRef.current;
    const caret = { start: el?.selectionStart ?? content.length, end: el?.selectionEnd ?? (el?.selectionStart ?? content.length) };
    const items = Array.from(e.clipboardData?.items || []);
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await processImageFiles(imageFiles, caret);
    }
  };

  const handleDrop: React.DragEventHandler<HTMLTextAreaElement> = async (e) => {
    e.preventDefault();
    const el = textareaRef.current;
    const caret = { start: el?.selectionStart ?? content.length, end: el?.selectionEnd ?? (el?.selectionStart ?? content.length) };
    const dt = e.dataTransfer;
    const files: File[] = [];
    if (dt?.items) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f && f.type.startsWith('image/')) files.push(f);
        }
      }
    } else if (dt?.files) {
      for (const f of Array.from(dt.files)) {
        if (f.type.startsWith('image/')) files.push(f);
      }
    }
    if (files.length > 0) {
      await processImageFiles(files, caret);
    }
  };

  const handleDragOver: React.DragEventHandler<HTMLTextAreaElement> = (e) => {
    // Allow dropping
    e.preventDefault();
  };
  
  // 編集モードでない場合は非表示
  if (!isEditing) {
    return null;
  }

  return (
    <div className={styles.editorContainer}>
      <EditorHeader documentPath={documentPath} />
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          margin: '8px 0',
          color: '#c00'
        }}>
          <strong>エラー:</strong> {error}
        </div>
      )}
      
      <EditorContent 
        isLoading={isLoading}
        content={content}
        onContentChange={handleContentChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        textareaRef={textareaRef}
      />
    </div>
  );
}
