import React from 'react';

import SwapPanel from './_components/SwapPanel';
import { TokenSelectModal } from './_components/TokenSelectModal';

export function TradePage() {
  return (
    <>
      <div className="flex flex-col">
        <SwapPanel />
        <TokenSelectModal />
      </div>
    </>
  );
}
