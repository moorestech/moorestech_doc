import React from 'react';
import {ThemeClassNames} from '@docusaurus/theme-common';
import Link from "@docusaurus/Link";
import Translate from '@docusaurus/Translate';
import IconEdit from '@theme/Icon/Edit';
import IconGithub from '@theme/Icon/Socials/GitHub';
import config from "@site/docusaurus.config";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function EditThisPageWrapper(props) {
    const {siteConfig} = useDocusaurusContext();
    const {cmsEditUrl} = siteConfig.customFields;
    const {githubEditUrl} = siteConfig.customFields;

    const editGithubUrl = props.editUrl.replace(cmsEditUrl, githubEditUrl);

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

            <Link to={props.editUrl} className={ThemeClassNames.common.editThisPage}>
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
