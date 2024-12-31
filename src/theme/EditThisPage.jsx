import React from 'react';
import EditThisPage from '@theme-original/EditThisPage';
import {useThemeConfig} from '@docusaurus/theme-common';

export default function EditThisPageWrapper(props) {
    const {customFields} = useThemeConfig();
    return (
        <>
            <EditThisPage {...props} />
            {customFields.cmsEditUrl && (
                <a
                    href={`${customFields.cmsEditUrl}/${props.editUrl.split('/').pop()}`}
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    Edit with CMS
                </a>
            )}
        </>
    );
}
