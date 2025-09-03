import {useCallback} from 'react';
import {useHistory} from '@docusaurus/router';

/**
 * 編集モードの制御を管理するカスタムフック
 * @param documentPath - ドキュメントのパス
 * @returns 編集モード終了関数
 */
export function useEditMode(documentPath: string) {
  const history = useHistory();
  
  const exitEditMode = useCallback(() => {
    // URLから?edit=trueを削除して通常モードに戻る
    history.push(documentPath);
  }, [documentPath, history]);

  return {
    exitEditMode
  };
}