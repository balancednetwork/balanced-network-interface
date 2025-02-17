import { Typography } from '@/app/theme';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { formatBalance } from '@/utils/formatter';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React from 'react';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';
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
  xChainId,
  onSelect,
  price,
  currency,
}: {
  xChainId: XChainId;
  currency: Currency;
  price: string;
  onSelect: (currency: Currency, xChainId: XChainId) => void;
}) => {
  const xWallet = useCrossChainWalletBalances();
  const xToken = xTokenMap[xChainId].find(token => token.symbol === currency.symbol);
  const currencyBalance: CurrencyAmount<Currency> | undefined = xWallet[xChainId]?.[xToken?.wrapped.address ?? ''];
  const hasSignedIn = useHasSignedIn();
  const theme = useTheme();

  const hideBecauseOfLowValue = shouldHideBecauseOfLowValue(
    true,
    new BigNumber(price),
    new BigNumber(currencyBalance?.toFixed() || 0),
  );

  if (hideBecauseOfLowValue) {
    return null;
  }

  return (
    <CurrencyXChainItemWrap onClick={() => onSelect(currency, xChainId)}>
      <Flex alignItems="center">
        <CurrencyLogoWithNetwork currency={currency} chainId={xChainId} bgColor={theme.colors.bg3} size="22px" />
        <Typography variant="span" fontSize={14} display="block" ml="10px" pt="4px">
          {xChainMap[xChainId].name}
        </Typography>
      </Flex>
      {hasSignedIn && (
        <Typography variant="span" fontSize={14} display="block">
          {currencyBalance ? formatBalance(currencyBalance?.toFixed(), price).replace(/^0(\.0+)?$/, '-') : '-'}
        </Typography>
      )}
    </CurrencyXChainItemWrap>
  );
};

export default React.memo(CurrencyXChainItem);
