import React, {useEffect, useState} from 'react';
import OriginalContent from '@theme-original/DocItem/Content';
import {useLocation} from '@docusaurus/router';
import InlineEditor from '@site/src/components/InlineEditor';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useIsAuthenticated } from '@site/src/auth/contexts/AuthContext';
import LoginPrompt from '@site/src/components/InlineEditor/LoginPrompt';

export default function DocItemContentWrapper(props: any) {
  const {search, pathname} = useLocation();
  const [editMode, setEditMode] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const params = new URLSearchParams(search);
    const shouldEdit = params.get('edit') === 'true';
    setEditMode(shouldEdit);
    
    // ページ遷移時のカスタムフック
    if (typeof (window as any).__onDocPageView === 'function') {
      (window as any).__onDocPageView(pathname);
    }
    
    console.log('[DocItem] Page loaded:', pathname, 'Edit mode:', shouldEdit, 'Authenticated:', isAuthenticated);
  }, [search, pathname, isAuthenticated]);
  
  // エディットモードの時は認証状態を確認
  if (editMode) {
    if (!isAuthenticated) {
      return <LoginPrompt documentPath={pathname} />;
    }
    return <InlineEditor documentPath={pathname} originalProps={props} />;
  }
  
  return <OriginalContent {...props} />;
}
