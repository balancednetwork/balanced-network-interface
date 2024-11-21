import React from 'react';

import Header from '@/app/components/Header';

export const DefaultLayout: React.FC<{ title?: string; children: React.ReactNode }> = props => {
  const { children } = props;

  return (
    <>
      <div className="flex flex-col w-full min-h-screen mx-auto px-6 md:px-[40px] lg:px-[80px] bg-background bg-[url('/marsh-flying.png')] bg-[calc(50%+240px)_190px] bg-[length:441px] bg-no-repeat">
        <Header className="my-6 sm:mt-12 sm:mb-10" />
        {children}
      </div>
    </>
  );
};
