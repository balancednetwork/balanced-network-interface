import React from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

import { Typography } from 'app/theme';
import { useTokenPrices } from 'queries/backendv2';

const RewardTokenItem = ({ reward }: { reward: CurrencyAmount<Token> }) => {
  const { data: prices } = useTokenPrices();
  const price = prices?.[reward.currency.symbol!];

  return (
    <>
      <Typography color="text1" textAlign="right">
        {reward.toFixed(2, { groupSeparator: ',' })}
      </Typography>
      <Typography color="text2">{reward.currency.symbol}</Typography>
      <Typography color="text1" textAlign="right">
        ${price ? new BigNumber(reward.toFixed()).times(price).toFormat(2) : '-'}
      </Typography>
    </>
  );
};

export default RewardTokenItem;
