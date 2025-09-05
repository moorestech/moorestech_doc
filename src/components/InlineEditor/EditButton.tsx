import React from 'react';
import { useLocation } from '@docusaurus/router';
import IconEdit from '@theme/Icon/Edit';
import { useEditState, useIsEditing } from '../../contexts/EditStateContext';

export default function EditButton() {
  const location = useLocation();
  const { enterEditMode, exitEditMode } = useEditState();
  const isEditMode = useIsEditing();
  
  const handleEditClick = () => {
    // 編集モードに入る（現在のパスを渡す）
    enterEditMode(location.pathname);
  };
  
  const handleBackClick = () => {
    // 編集モードを終了
    exitEditMode();
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