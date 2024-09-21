import React from 'react';

import Header from '@/app/components/Header';

export const DefaultLayout: React.FC<{ title?: string; children: React.ReactNode }> = props => {
  const { children } = props;

  return (
    <>
      <div className="flex flex-col max-w-screen-xl min-h-screen mx-auto px-4 lg:px-10 bg-background">
        <Header className="my-6 lg:my-12" />
        {children}
      </div>
    </>
  );
};
