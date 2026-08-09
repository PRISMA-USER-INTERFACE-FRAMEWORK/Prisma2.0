import React from 'react';
import FaqWidget from '@site/src/components/FaqWidget';

// Docusaurus renders this around the whole app, so the FAQ launcher shows on every page.
export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      {children}
      <FaqWidget />
    </>
  );
}
