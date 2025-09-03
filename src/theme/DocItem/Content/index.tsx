import React, {useEffect, useState} from 'react';
import OriginalContent from '@theme-original/DocItem/Content';
import {useLocation} from '@docusaurus/router';
import InlineEditor from '@site/src/components/InlineEditor';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export default function DocItemContentWrapper(props: any) {
  const {search, pathname} = useLocation();
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    const params = new URLSearchParams(search);
    const shouldEdit = params.get('edit') === 'true';
    setEditMode(shouldEdit);
    
    // ページ遷移時のカスタムフック
    if (typeof (window as any).__onDocPageView === 'function') {
      (window as any).__onDocPageView(pathname);
    }
    
    console.log('[DocItem] Page loaded:', pathname, 'Edit mode:', shouldEdit);
  }, [search, pathname]);
  
  // エディットモードの時はエディタのみ表示、それ以外は通常のコンテンツ
  if (editMode) {
    return <InlineEditor documentPath={pathname} originalProps={props} />;
  }
  
  return <OriginalContent {...props} />;
}