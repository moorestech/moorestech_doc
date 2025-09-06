import { useState, useEffect } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { EditorConfig } from '../config/editor.config';
import { determineRepository } from '../utils/github';
import type { Repository } from '../theme/DocSidebar/Desktop/EditableSidebar/types';

export function useRepository(token: string | null) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [branch] = useState<string>(() => EditorConfig.getInstance().getBranch());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    // トークンがない場合は何もしない
    if (!token) {
      setLoading(false);
      setRepo(null);
      setError('認証が必要です');
      return;
    }
    
    let mounted = true;
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const cfg = EditorConfig.getInstance();
        const r = await determineRepository(cfg.getOwner(), cfg.getRepo(), token);
        if (!mounted) return;
        setRepo(r);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'リポジトリの判定に失敗しました');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [token]);

  return {
    repo,
    branch,
    loading,
    error
  };
}