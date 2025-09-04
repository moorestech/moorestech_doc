import {useState, useEffect} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {normalizeDocPath, fetchGitHubContent, determineRepository, buildCustomGitHubRawUrl} from '../utils/github';
import { EditorConfig } from '../../../config/editor.config';
import { useAuthToken } from '../../../auth/contexts/AuthContext';

/**
 * GitHubからドキュメントコンテンツを取得するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns コンテンツ、ローディング状態、コンテンツ更新関数、リポジトリ情報
 */
export function useGitHubContent(documentPath: string) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [repoInfo, setRepoInfo] = useState<{owner: string; repo: string} | null>(null);
  const token = useAuthToken();

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || !documentPath) return;
    
    const loadContent = async () => {
      setIsLoading(true);
      
      try {
        const config = EditorConfig.getInstance();
        
        // 権限に応じてリポジトリを決定
        const repo = await determineRepository(
          config.getOwner(),
          config.getRepo(),
          token
        );
        setRepoInfo(repo);
        
        const filePath = normalizeDocPath(documentPath);
        
        // 決定したリポジトリからコンテンツを取得
        const rawUrl = buildCustomGitHubRawUrl(
          repo.owner,
          repo.repo,
          config.getBranch(),
          filePath
        );
        
        console.log('Fetching from GitHub:', rawUrl);
        
        const fetchedContent = await fetchGitHubContent(rawUrl);
        setContent(fetchedContent);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [documentPath, token]);

  return {
    content,
    setContent,
    isLoading,
    repoInfo
  };
}