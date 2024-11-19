import React from 'react';

import Header from '@/app/components/Header';
import { cn } from '@/lib/utils';

export const DefaultLayout: React.FC<{ title?: string; children: React.ReactNode }> = props => {
  const { children } = props;

  return (
    <>
      <div
        className={cn(
          "flex flex-col w-full min-h-screen mx-auto px-4 py-10 bg-background bg-[url('/marsh-flying.png')] bg-[-126px_40px] bg-[length:310px] bg-no-repeat",
          'sm:px-[40px] lg:px-[80px] sm:bg-[calc(50%+240px)_190px] sm:bg-[length:441px]',
        )}
      >
        <Header className="mb-[120px] sm:mb-10" />
        {children}
      </div>
    </>
  );
};
