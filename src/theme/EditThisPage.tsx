import React from 'react';
import {ThemeClassNames} from '@docusaurus/theme-common';
import Link from "@docusaurus/Link";
import Translate from '@docusaurus/Translate';
import IconEdit from '@theme/Icon/Edit';
import IconGithub from '@theme/Icon/Socials/GitHub';
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function EditThisPageWrapper(props) {
    const {siteConfig} = useDocusaurusContext();
    const {githubEditUrl} = siteConfig.customFields;
    
    // GitHubの編集URLを生成
    const editGithubUrl = props.editUrl.replace('/admin/#/collections/doc/', githubEditUrl);
    
    // TinaCMSの編集URLを生成
    const tinaEditUrl = props.editUrl;

    return (
        <>
            <Link to={editGithubUrl} className={ThemeClassNames.common.editThisPage}>
                <IconGithub /> <> </>
                <Translate
                    id="theme.common.editThisPage"
                    description="The link label to edit the current page">
                    Edit on Github
                </Translate>
            </Link>

            <> / </>

            <Link to={tinaEditUrl} className={ThemeClassNames.common.editThisPage}>
                <IconEdit />
                <Translate
                    id="theme.common.editThisPage"
                    description="The link label to edit the current page">
                    Edit with TinaCMS
                </Translate>
            </Link>
        </>
    );
}
