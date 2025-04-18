import React from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken, xChainMap } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';

interface BridgeLimitWarningProps {
  limitAmount: CurrencyAmount<XToken>;
  onLimitAmountClick: (amount: CurrencyAmount<XToken>) => void;
}

const BridgeLimitWarning: React.FC<BridgeLimitWarningProps> = props => {
  const { limitAmount, onLimitAmountClick } = props;

  return (
    <Flex alignItems="center" justifyContent="center" mt={2}>
      <Typography textAlign="center">
        {new BigNumber(limitAmount.toFixed()).isGreaterThanOrEqualTo(0.0001) ? (
          <>
            <Trans>Only</Trans>{' '}
            <UnderlineText onClick={() => onLimitAmountClick(limitAmount)}>
              <Typography color="primaryBright" as="a">
                {limitAmount?.toFixed(4, { groupSeparator: ',' })} {limitAmount?.currency?.symbol}
              </Typography>
            </UnderlineText>{' '}
          </>
        ) : (
          <>
            <Trans>0 {limitAmount?.currency?.symbol}</Trans>{' '}
          </>
        )}

        <Trans>available on {xChainMap[limitAmount?.currency.xChainId].name}.</Trans>
      </Typography>
    </Flex>
  );
};

export default BridgeLimitWarning;
