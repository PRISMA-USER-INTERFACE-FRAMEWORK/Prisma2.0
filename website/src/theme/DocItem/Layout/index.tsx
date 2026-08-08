import React from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import type LayoutType from '@theme/DocItem/Layout';
import type { WrapperProps } from '@docusaurus/types';
import AiToolbar from '@site/src/components/AiToolbar';
import styles from './styles.module.css';

type Props = WrapperProps<typeof LayoutType>;

export default function LayoutWrapper(props: Props): JSX.Element {
  return (
    <>
      <div className={styles.toolbarRow}>
        <AiToolbar />
      </div>
      <OriginalLayout {...props} />
    </>
  );
}
