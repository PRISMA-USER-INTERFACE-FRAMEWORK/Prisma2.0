import React from 'react';
import OriginalFooter from '@theme-original/DocItem/Footer';
import type FooterType from '@theme/DocItem/Footer';
import type { WrapperProps } from '@docusaurus/types';
import AiToolbar from '@site/src/components/AiToolbar';

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): JSX.Element {
  return (
    <>
      <AiToolbar />
      <OriginalFooter {...props} />
    </>
  );
}
