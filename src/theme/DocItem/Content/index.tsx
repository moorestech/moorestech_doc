import React, {useEffect} from 'react';
import OriginalContent from '@theme-original/DocItem/Content';
import {useLocation} from '@docusaurus/router';
import InlineEditor from '@site/src/components/InlineEditor';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useIsAuthenticated } from '@site/src/auth/contexts/AuthContext';
import { useIsEditing, useEditingPath, useEditState } from '@site/src/contexts/EditStateContext';
import LoginPrompt from '@site/src/components/InlineEditor/LoginPrompt';

export default function DocItemContentWrapper(props: any) {
  const {pathname} = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const isEditing = useIsEditing();
  const editingPath = useEditingPath();
  const { enterEditMode } = useEditState();
  
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    // ページ遷移時のカスタムフック
    if (typeof (window as any).__onDocPageView === 'function') {
      (window as any).__onDocPageView(pathname);
    }
    
    // 編集モードで、かつ現在のページが編集対象でない場合は編集パスを更新
    if (isEditing && editingPath !== pathname) {
      enterEditMode(pathname);
    }
    
    console.log('[DocItem] Page loaded:', pathname, 'Edit mode:', isEditing, 'Authenticated:', isAuthenticated);
  }, [pathname, isAuthenticated, isEditing, editingPath, enterEditMode]);
  
  // エディットモードの時は認証状態を確認
  if (isEditing) {
    if (!isAuthenticated) {
      return <LoginPrompt documentPath={pathname} />;
    }
    return <InlineEditor documentPath={pathname} originalProps={props} />;
  }
  
  return <OriginalContent {...props} />;
}
