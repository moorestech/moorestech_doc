import {useCallback, useEffect} from 'react';
import {useHistory} from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * 編集モードの制御とキーボードショートカットを管理するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns 編集モード終了関数
 */
export function useEditMode(documentPath: string) {
  const history = useHistory();
  
  const exitEditMode = useCallback(() => {
    // URLから?edit=trueを削除して通常モードに戻る
    history.push(documentPath);
  }, [documentPath, history]);

  // Escapeキーで編集モード終了
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitEditMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitEditMode]);

  return {
    exitEditMode
  };
}