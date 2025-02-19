import { CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { XToken, xChainMap } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React from 'react';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';

import { Typography } from '@/app/theme';
import { formatBalance } from '@/utils/formatter';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { shouldHideBecauseOfLowValue } from './utils';

const CurrencyXChainItemWrap = styled(Flex)`
  width: 100%;
  justify-content: space-between;
  padding: 8px 0;
  transition: color 0.2s ease;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

const CurrencyXChainItem = ({
  onSelect,
  price,
  balance,
}: {
  balance: CurrencyAmount<XToken> | undefined;
  price: Fraction | undefined;
  onSelect: (currency: XToken) => void;
}) => {
  const theme = useTheme();

  const hideBecauseOfLowValue = shouldHideBecauseOfLowValue(
    true,
    price && new BigNumber(price.toFixed(18)),
    new BigNumber(balance?.toFixed() || 0),
  );

  if (hideBecauseOfLowValue) return null;

  if (!balance) return null;

  return (
    <CurrencyXChainItemWrap onClick={() => onSelect(balance.currency)}>
      <Flex alignItems="center">
        <CurrencyLogoWithNetwork
          currency={balance.currency}
          chainId={balance.currency.xChainId}
          bgColor={theme.colors.bg3}
          size="22px"
        />
        <Typography variant="span" fontSize={14} display="block" ml="10px" pt="4px">
          {xChainMap[balance.currency.xChainId].name}
        </Typography>
      </Flex>
      <Typography variant="span" fontSize={14} display="block">
        {balance ? formatBalance(balance?.toFixed(), price?.toFixed(18)).replace(/^0(\.0+)?$/, '-') : '-'}
      </Typography>
    </CurrencyXChainItemWrap>
  );
};

export default React.memo(CurrencyXChainItem);
