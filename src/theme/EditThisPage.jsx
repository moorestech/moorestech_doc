import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {ThemeClassNames} from '@docusaurus/theme-common';
import Link from "@docusaurus/Link";
import Translate from '@docusaurus/Translate';
import IconEdit from '@theme/Icon/Edit';
import IconGithub from '@theme/Icon/Socials/GitHub';

export default function EditThisPageWrapper(props) {
    const {customFields} = useThemeConfig();
    return (
        <>
            <Link to={`${customFields.githubEditUrl}/${props.editUrl.split('/').pop()}`} className={ThemeClassNames.common.editThisPage}>
                <IconGithub /> <> </>
                <Translate
                    id="theme.common.editThisPage"
                    description="The link label to edit the current page">
                    Edit on Github
                </Translate>
            </Link>

            <> / </>

            <Link to={`${customFields.cmsEditUrl}/${props.editUrl.split('/').pop()}`} className={ThemeClassNames.common.editThisPage}>
                <IconEdit />
                <Translate
                    id="theme.common.editThisPage"
                    description="The link label to edit the current page">
                    Edit on holocron editor
                </Translate>
            </Link>
        </>
    );
}
