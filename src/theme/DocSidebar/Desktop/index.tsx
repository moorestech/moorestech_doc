import React, { useState } from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import EditableSidebar from './EditableSidebar';
import styles from './styles.module.css';

interface DocSidebarDesktopProps {
  path: string;
  sidebar: any;
  onCollapse: () => void;
  isHidden: boolean;
}

function DocSidebarDesktop({path, sidebar, onCollapse, isHidden}: DocSidebarDesktopProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    navbar: {hideOnScroll},
    docs: {
      sidebar: {hideable},
    },
  } = useThemeConfig();
  
  return (
    <div
      className={clsx(
        styles.sidebar,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden,
      )}>
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      
      {/* 編集モード切り替えボタン */}
      <div className={styles.editButtonContainer}>
        <button
          className={clsx(styles.editButton, isEditMode && styles.editButtonActive)}
          onClick={() => setIsEditMode(!isEditMode)}
          title={isEditMode ? '編集モードを終了' : '編集モード'}
        >
          {isEditMode ? '✓ 編集中' : '✏️ 編集'}
        </button>
      </div>
      
      {/* コンテンツの表示切り替え */}
      {isEditMode ? (
        <EditableSidebar items={sidebar} path={path} />
      ) : (
        <Content path={path} sidebar={sidebar} />
      )}
      
      {hideable && <CollapseButton onClick={onCollapse} />}
    </div>
  );
}

export default React.memo(DocSidebarDesktop);