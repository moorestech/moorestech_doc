import React from 'react';
import clsx from 'clsx';
import {
  NavbarSecondaryMenuFiller,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import DocSidebarItems from '@theme/DocSidebarItems';
import EditableSidebar from '@theme/DocSidebar/Desktop/EditableSidebar';
import { useIsEditing } from '@site/src/contexts/EditStateContext';

interface DocSidebarMobileSecondaryMenuProps {
  sidebar: any;
  path: string;
}

const DocSidebarMobileSecondaryMenu = ({sidebar, path}: DocSidebarMobileSecondaryMenuProps) => {
  const mobileSidebar = useNavbarMobileSidebar();
  const isEditMode = useIsEditing();

  if (isEditMode) {
    return (
      <div className={clsx(ThemeClassNames.docs.docSidebarMenu)}>
        <EditableSidebar items={sidebar} path={path} />
      </div>
    );
  }

  return (
    <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
      <DocSidebarItems
        items={sidebar}
        activePath={path}
        onItemClick={(item: any) => {
          // Mobile sidebar should only be closed if the category has a link
          if (item.type === 'category' && item.href) {
            mobileSidebar.toggle();
          }
          if (item.type === 'link') {
            mobileSidebar.toggle();
          }
        }}
        level={1}
      />
    </ul>
  );
};

function DocSidebarMobile(props: any) {
  return (
    <NavbarSecondaryMenuFiller
      component={DocSidebarMobileSecondaryMenu}
      props={props}
    />
  );
}

export default React.memo(DocSidebarMobile);
