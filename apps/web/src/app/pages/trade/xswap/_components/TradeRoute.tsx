import React, { memo } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { Route } from '@balancednetwork/v1-sdk';
import { ChevronRight } from 'react-feather';

function TradeRoute({ route }: { route: Route<Currency, Currency> }) {
  return (
    <>
      {route.path.map((token: Token, index: number) => (
        <span key={token.address}>
          {index > 0 && <ChevronRight size={14} />} {token.symbol}
        </span>
      ))}
    </>
  );
}

export default memo(TradeRoute);
