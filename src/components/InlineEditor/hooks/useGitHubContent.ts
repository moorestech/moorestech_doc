import {useState, useEffect} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {normalizeDocPath, fetchGitHubContent} from '../utils/github';
import { EditorConfig } from '../../../config/editor.config';

/**
 * GitHubからドキュメントコンテンツを取得するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns コンテンツ、ローディング状態、コンテンツ更新関数
 */
export function useGitHubContent(documentPath: string) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || !documentPath) return;
    
    const loadContent = async () => {
      setIsLoading(true);
      
      try {
        const config = EditorConfig.getInstance();
        const filePath = normalizeDocPath(documentPath);
        const rawUrl = `${config.getRawContentUrl()}/${filePath}`;
        
        console.log('Fetching from GitHub:', rawUrl);
        
        const fetchedContent = await fetchGitHubContent(rawUrl);
        setContent(fetchedContent);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [documentPath]);

  return {
    content,
    setContent,
    isLoading
  };
}