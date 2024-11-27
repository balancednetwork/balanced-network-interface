import React, { memo } from 'react';

import { Currency, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';
import { SLIPPAGE_WARNING_THRESHOLD } from '@/constants/misc';
import { formatPercent } from '@/utils';

interface PriceImpactProps {
  trade: Trade<Currency, Currency, TradeType> | undefined;
}

const PriceImpact: React.FC<PriceImpactProps> = memo(({ trade }) => {
  const showWarning = trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));

  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Typography>
        <Trans>Price impact</Trans>
      </Typography>

      <Typography className={showWarning ? 'error-anim' : ''} color={showWarning ? 'alert' : 'text'}>
        {priceImpact}
      </Typography>
    </Flex>
  );
});

export default PriceImpact;
