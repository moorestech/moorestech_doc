import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import IconEdit from '@theme/Icon/Edit';

export default function EditButton() {
  const history = useHistory();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // URLパラメータの変更を監視
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsEditMode(params.get('edit') === 'true');
  }, [location.search]);
  
  const handleEditClick = () => {
    // 現在のパスに?edit=trueを追加してソフトナビゲーション
    const currentPath = location.pathname;
    history.push(`${currentPath}?edit=true`);
  };
  
  const handleBackClick = () => {
    // ?edit=trueを削除して通常モードに戻る
    const currentPath = location.pathname;
    history.push(currentPath);
  };
  
  // 編集モードの場合はBackボタンを表示
  if (isEditMode) {
    return (
      <button 
        onClick={handleBackClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'transparent',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: 'var(--ifm-color-emphasis-600)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)';
          e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-600)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-300)';
        }}
      >
        <span style={{ fontSize: '1rem' }}>←</span>
        <span>Back</span>
      </button>
    );
  }
  
  // 通常モードの場合はEditボタンを表示
  return (
    <button 
      onClick={handleEditClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'transparent',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        color: 'var(--ifm-color-primary)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)';
        e.currentTarget.style.borderColor = 'var(--ifm-color-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-300)';
      }}
    >
      <IconEdit width={16} height={16} />
      <span>Edit</span>
    </button>
  );
}