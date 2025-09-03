import {useState, useEffect} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {normalizeDocPath, buildGitHubRawUrl, fetchGitHubContent} from '../utils/github';

/**
 * GitHubからドキュメントコンテンツを取得するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns コンテンツ、ローディング状態、コンテンツ更新関数
 */
export function useGitHubContent(documentPath: string) {
  const {siteConfig} = useDocusaurusContext();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || !documentPath) return;
    
    const loadContent = async () => {
      setIsLoading(true);
      
      try {
        const filePath = normalizeDocPath(documentPath);
        const githubBaseUrl = (siteConfig.customFields?.githubEditUrl as string) 
          || 'https://github.com/moorestech/moorestech_doc/tree/master';
        const rawUrl = buildGitHubRawUrl(githubBaseUrl, filePath);
        
        console.log('Fetching from GitHub:', rawUrl);
        
        const fetchedContent = await fetchGitHubContent(rawUrl);
        setContent(fetchedContent);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [documentPath, siteConfig]);

  return {
    content,
    setContent,
    isLoading
  };
}