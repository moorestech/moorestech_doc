import { useState, useCallback } from 'react';

interface SaveAndPrParams {
  documentPath: string;
  content: string | undefined;
  token: string | null;
  repoInfo: { owner: string; repo: string } | null | undefined;
}

interface SaveAndPrResult {
  isSaving: boolean;
  status: string | null;
  resultUrl: string | null;
  error: string | null;
  onSaveClick: () => Promise<void>;
}

export function useSaveAndPr({
  documentPath,
  content,
  token,
  repoInfo,
}: SaveAndPrParams): SaveAndPrResult {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSaveClick = useCallback(async () => {
    setError(null);
    setResultUrl(null);
    
    if (!content) {
      setError('コンテンツが空です');
      return;
    }
    if (!token) {
      setError('GitHubにログインしてください');
      return;
    }
    if (!repoInfo) {
      setError('保存先リポジトリが特定できません');
      return;
    }
    
    try {
      setIsSaving(true);
      setStatus('ブランチ作成と保存を開始します...');
      
      const { saveChangesAndOpenPR } = await import('../../../utils/github');
      const res = await saveChangesAndOpenPR({
        documentPath,
        content,
        token,
        targetOwner: repoInfo.owner,
        targetRepo: repoInfo.repo,
        onProgress: (m) => setStatus(m),
      });
      
      setResultUrl(res.prUrl);
      if (res.merged) {
        setStatus('PRを自動マージしました ✅');
      } else {
        setStatus('PRを作成しました');
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [content, token, repoInfo, documentPath]);

  return {
    isSaving,
    status,
    resultUrl,
    error,
    onSaveClick,
  };
}