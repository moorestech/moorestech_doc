import { useState, useEffect } from 'react';
import { EditorConfig } from '../../../../../config/editor.config';
import { useAuthToken } from '../../../../../auth/contexts/AuthContext';
import { determineRepository } from '../../../../../utils/github';
import { Repository } from '../types';

interface UseRepositoryReturn {
  repo: Repository | null;
  branch: string;
  loadingRepo: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useRepository = (): UseRepositoryReturn => {
  const token = useAuthToken();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [branch] = useState<string>(() => EditorConfig.getInstance().getBranch());
  const [loadingRepo, setLoadingRepo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the repository to operate on
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingRepo(true);
        const cfg = EditorConfig.getInstance();
        const r = await determineRepository(cfg.getOwner(), cfg.getRepo(), token || null);
        if (!mounted) return;
        setRepo(r);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message || 'リポジトリの判定に失敗しました');
      } finally {
        if (mounted) setLoadingRepo(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  return {
    repo,
    branch,
    loadingRepo,
    error,
    setError,
  };
};