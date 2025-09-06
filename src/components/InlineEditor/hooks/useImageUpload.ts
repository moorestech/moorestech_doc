import { useCallback } from 'react';

type UseImageUploadParams = {
  content: string;
  setContent: (next: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  addFile?: (path: string, content: string, encoding?: 'utf8' | 'base64') => void;
  addBinaryFile?: (path: string, base64: string) => void;
};

type Caret = { start: number; end: number };

const bytesToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slice = bytes.subarray(i, i + chunkSize) as any;
    binary += String.fromCharCode.apply(null, slice);
  }
  // eslint-disable-next-line no-undef
  return (typeof window !== 'undefined' && (window as any).btoa)
    ? (window as any).btoa(binary)
    : Buffer.from(bytes).toString('base64');
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

export function useImageUpload({ content, setContent, textareaRef, addFile, addBinaryFile }: UseImageUploadParams) {
  // Insert text at caret preserving selection and focus
  const insertAtPosition = useCallback((text: string, start: number, end: number) => {
    const el = textareaRef.current;
    const s = Math.max(0, Math.min(start ?? 0, content.length));
    const e = Math.max(s, Math.min(end ?? s, content.length));
    const before = content.slice(0, s);
    const after = content.slice(e);
    const next = before + text + after;
    setContent(next);
    if (el) {
      const pos = s + text.length;
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      }, 0);
    }
  }, [content, setContent, textareaRef]);

  const processImageFiles = useCallback(async (files: File[], at?: Caret) => {
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
        if (addBinaryFile) {
          addBinaryFile(repoPath, base64);
        } else if (addFile) {
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
  }, [addBinaryFile, addFile, content, insertAtPosition, textareaRef]);

  const handlePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = useCallback(async (e) => {
    const el = textareaRef.current;
    const caret: Caret = {
      start: el?.selectionStart ?? content.length,
      end: el?.selectionEnd ?? (el?.selectionStart ?? content.length),
    };
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
  }, [content.length, processImageFiles, textareaRef]);

  const handleDrop: React.DragEventHandler<HTMLTextAreaElement> = useCallback(async (e) => {
    e.preventDefault();
    const el = textareaRef.current;
    const caret: Caret = {
      start: el?.selectionStart ?? content.length,
      end: el?.selectionEnd ?? (el?.selectionStart ?? content.length),
    };
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
  }, [content.length, processImageFiles, textareaRef]);

  const handleDragOver: React.DragEventHandler<HTMLTextAreaElement> = useCallback((e) => {
    e.preventDefault();
  }, []);

  return { handlePaste, handleDrop, handleDragOver };
}
