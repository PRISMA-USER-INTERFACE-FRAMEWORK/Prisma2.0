import React from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import type LayoutType from '@theme/DocItem/Layout';
import type { WrapperProps } from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AiToolbar from '@site/src/components/AiToolbar';
import {findMicrosite} from '@site/src/microsites';
import styles from './styles.module.css';

type Props = WrapperProps<typeof LayoutType>;

// The AI toolbar (Copy as Markdown / AI Tools) only knows about PrismaUI F4's own docs,
// so it's excluded on a microsite's guide pages.
export default function LayoutWrapper(props: Props): JSX.Element {
  const {pathname} = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const isMicrosite = Boolean(findMicrosite(pathname, siteConfig.baseUrl));

  return (
    <>
      {!isMicrosite && (
        <div className={styles.toolbarRow}>
          <AiToolbar />
        </div>
      )}
      <OriginalLayout {...props} />
    </>
  );
}
