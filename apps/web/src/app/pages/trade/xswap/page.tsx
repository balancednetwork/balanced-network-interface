import React from 'react';

import SwapDescription from './_components/SwapDescription';
import SwapPanel from './_components/SwapPanel';
import TokenList from './_components/TokenList';

export function TradePage() {
  return (
    <>
      <div className="flex flex-col">
        <SwapPanel />
        <SwapDescription />
      </div>
      <TokenList />
    </>
  );
}
