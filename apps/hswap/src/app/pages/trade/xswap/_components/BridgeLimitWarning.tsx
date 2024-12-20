import React from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';

interface BridgeLimitWarningProps {
  limitAmount: CurrencyAmount<XToken>;
  onLimitAmountClick: (amount: CurrencyAmount<XToken>) => void;
}

const BridgeLimitWarning: React.FC<BridgeLimitWarningProps> = props => {
  const { limitAmount, onLimitAmountClick } = props;

  return (
    <div className="flex items-center justify-center mt-2">
      <div className="text-center text-[14px]">
        <Trans>Max</Trans>{' '}
        <span
          className="text-warning font-bold hover:underline cursor-pointer"
          onClick={() => onLimitAmountClick(limitAmount)}
        >
          {limitAmount?.toFixed(4)}
        </span>{' '}
        {limitAmount?.currency?.symbol}
      </div>
    </div>
  );
};

export default BridgeLimitWarning;
