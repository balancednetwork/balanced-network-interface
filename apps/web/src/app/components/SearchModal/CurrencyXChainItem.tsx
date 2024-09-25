import { Typography } from '@/app/theme';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useWalletBalances } from '@/store/wallet/hooks';
import { formatBalance } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChainId, XToken } from '@balancednetwork/sdk-core';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import React from 'react';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../components2/CurrencyLogoWithNetwork';

const CurrencyXChainItemWrap = styled(Flex)`
  width: 100%;
  justify-content: space-between;
  padding: 8px 0;
  transition: color 0.2s ease;
  color: ${({ theme }) => theme.colors?.text};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors?.primaryBright};
  }
`;

const CurrencyXChainItem = ({
  xChainId,
  onSelect,
  price,
  currency,
}: {
  xChainId: XChainId;
  currency: XToken;
  price: string;
  onSelect: (currency: XToken, xChainId: XChainId) => void;
}) => {
  const walletBalances = useWalletBalances();
  const xToken = xTokenMap[currency.wrapped.address];
  const currencyBalance: CurrencyAmount<XToken> | undefined = walletBalances[xChainId]?.[xToken?.wrapped.address ?? ''];
  const hasSignedIn = useHasSignedIn();
  const theme: any = {};

  return (
    <CurrencyXChainItemWrap onClick={() => onSelect(currency, xChainId)}>
      <Flex alignItems="center">
        <CurrencyLogoWithNetwork currency={currency} size="22px" />
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

export default CurrencyXChainItem;
