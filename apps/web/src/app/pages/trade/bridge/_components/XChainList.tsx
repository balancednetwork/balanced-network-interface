import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ChainLogo } from '@/app/components/ChainLogo';
import { XChainId, XChain } from '@/app/pages/trade/bridge/types';
import { xChains } from '@/app/pages/trade/bridge/_config/xChains';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatValue } from '@/utils/formatter';
import BigNumber from 'bignumber.js';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { HeaderText } from '@/app/components/List';
import { ScrollHelper } from '@/app/components/home/_components/LoanChainSelector/styledComponents';
import { t } from '@lingui/macro';

type XChainListProps = {
  xChainId: XChainId;
  setChainId: (chain: XChainId) => void;
  currency?: Currency;
  chains?: XChain[];
  width?: number;
};

type XChainItemProps = {
  xChain: XChain;
  currency?: Currency;
  isActive: boolean;
  isLast: boolean;
};

const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
`;

const XChainItemWrap = styled(Flex)`
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: color 0.3s ease;
  align-items: center;
  padding: 20px 0;
  &:hover {
    color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

const XChainItem = ({ xChain, isActive, isLast, currency }: XChainItemProps) => {
  const xWallet = useCrossChainWalletBalances();
  const prices = useRatesWithOracle();

  const currencyAmount = React.useMemo(() => {
    if (!xWallet || !xChain) return;

    return Object.values(xWallet[xChain.xChainId] || {}).find(
      currencyAmount => currencyAmount.currency.symbol === currency?.symbol,
    );
  }, [xWallet, currency, xChain]);

  const price = React.useMemo(() => {
    if (!prices || !currencyAmount) return;

    return prices[currencyAmount.currency.symbol];
  }, [prices, currencyAmount]);

  const value = React.useMemo(() => {
    if (!price || !currencyAmount) return;

    return price.times(new BigNumber(currencyAmount.toFixed()));
  }, [price, currencyAmount]);

  return (
    <XChainItemWrap className={isLast ? '' : 'border-bottom'}>
      <Flex width="100%" alignItems="center">
        <Box pr="10px">
          <ChainLogo chain={xChain} />
        </Box>
        <Typography fontWeight="bold" marginRight={2}>
          {xChain.name}
        </Typography>
        <Typography ml="auto">{value ? formatValue(value.toFixed()) : '-'}</Typography>
      </Flex>
    </XChainItemWrap>
  );
};

const XChainList = ({ xChainId, setChainId, chains, currency, width }: XChainListProps) => {
  const relevantChains = chains || xChains;
  const sortedChains = relevantChains.sort((a, b) => (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1));

  return (
    <Box p={'25px 25px 5px'} width={width}>
      <SearchInput style={{ marginBottom: '15px' }} placeholder={t`Search for blockchains...`} />
      <ScrollHelper $height="285px">
        <Flex width="100%" justifyContent="space-between">
          <StyledHeaderText>Blockchain</StyledHeaderText>
          <StyledHeaderText>Wallet</StyledHeaderText>
        </Flex>
        {sortedChains.map((chainItem, index) => (
          <Box key={index} onClick={e => setChainId(chainItem.xChainId)}>
            <XChainItem
              xChain={chainItem}
              currency={currency}
              isActive={xChainId === chainItem.xChainId}
              isLast={relevantChains.length === index + 1}
            />
          </Box>
        ))}
      </ScrollHelper>
    </Box>
  );
};

export default XChainList;
