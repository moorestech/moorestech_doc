import {useState, useEffect} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {normalizeDocPath, fetchGitHubContent, determineRepository, buildCustomGitHubRawUrl} from '../../../utils/github';
import { EditorConfig } from '../../../config/editor.config';
import { useAuthToken } from '../../../auth/contexts/AuthContext';

/**
 * GitHubからドキュメントコンテンツを取得するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns コンテンツ、ローディング状態、コンテンツ更新関数、リポジトリ情報、Fork作成状態
 */
export function useGitHubContent(documentPath: string) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [repoInfo, setRepoInfo] = useState<{owner: string; repo: string} | null>(null);
  const [isForkCreating, setIsForkCreating] = useState(false);
  const [forkCreationMessage, setForkCreationMessage] = useState('');
  const [forkCreationError, setForkCreationError] = useState<string | null>(null);
  const token = useAuthToken();

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || !documentPath) return;
    
    const loadContent = async () => {
      setIsLoading(true);
      setForkCreationError(null);
      
      try {
        const config = EditorConfig.getInstance();
        
        // Fork作成の進捗を処理するコールバック
        const handleForkProgress = (message: string) => {
          setForkCreationMessage(message);
          // Fork作成プロセスが開始されたらモーダルを表示
          if (message.includes('Fork') || message.includes('確認')) {
            setIsForkCreating(true);
          }
          // エラーメッセージの処理
          if (message.startsWith('エラー:')) {
            setForkCreationError(message);
          }
        };
        
        // 権限に応じてリポジトリを決定
        const repo = await determineRepository(
          config.getOwner(),
          config.getRepo(),
          token,
          handleForkProgress
        );
        setRepoInfo(repo);
        
        // Fork作成が完了したらモーダルを閉じる
        if (isForkCreating && !forkCreationError) {
          setIsForkCreating(false);
          setForkCreationMessage('');
        }
        
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
      } catch (error) {
        console.error('Error loading content:', error);
        setForkCreationError(error.message || 'コンテンツの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
        // エラーがなければFork作成モーダルを閉じる
        if (!forkCreationError) {
          setIsForkCreating(false);
        }
      }
    };
    
    loadContent();
  }, [documentPath, token]);

  const clearForkError = () => {
    setForkCreationError(null);
    setIsForkCreating(false);
    setForkCreationMessage('');
  };

  return {
    content,
    setContent,
    isLoading,
    repoInfo,
    isForkCreating,
    forkCreationMessage,
    forkCreationError,
    clearForkError
  };
}