import React, { useMemo, useState } from 'react';

import { Box } from 'rebass';

import { ChainLogo } from '@/app/components/ChainLogo';
import { xChains } from '@/constants/xChains';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { Trans, t } from '@lingui/macro';
import { HeaderText } from '@/app/components/Wallet/styledComponents';
import { Typography } from '@/app/theme';
import { useSignedInWallets } from '@/app/pages/trade/bridge/_hooks/useWallets';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { isMobile } from 'react-device-detect';
import { ChainItemWrap, Grid, ScrollHelper, SelectorWrap } from '../LoanChainSelector/styledComponents';
import { useCollateralAmounts, useCollateralType } from '@/store/collateral/hooks';
import { xTokenMap } from '@/app/pages/trade/bridge/_config/xTokens';
import { useOraclePrices } from '@/store/oracle/hooks';
import BigNumber from 'bignumber.js';
import { formatValue } from '@/utils/formatter';
import { XChain, XChainId } from '@/types';

type ChainListProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  chains?: XChain[];
  width: number | undefined;
};

type ChainItemProps = {
  chain: XChain;
  isActive: boolean;
  isLast: boolean;
  setChainId: (chain: XChainId) => void;
};

const ChainItem = ({ chain, setChainId, isLast }: ChainItemProps) => {
  const signedInWallets = useSignedInWallets();
  const isSignedIn = signedInWallets.some(wallet => wallet.xChainId === chain.xChainId);
  const crossChainBalances = useCrossChainWalletBalances();
  const collateralType = useCollateralType();
  const xToken = xTokenMap[chain.xChainId].find(xToken => xToken.symbol === collateralType);
  const depositedAmounts = useCollateralAmounts(chain.xChainId);
  const existingPosition = depositedAmounts[collateralType];
  const prices = useOraclePrices();
  const xTokenPrice = prices?.[xToken?.symbol || ''];

  const formattedWalletBalance = useMemo(() => {
    if (existingPosition?.isGreaterThan(0) || !xToken) return;
    const balance = crossChainBalances[chain.xChainId]?.[xToken.address];
    if (!balance || !balance.greaterThan(0)) return `-`;

    return xTokenPrice
      ? `${formatValue(new BigNumber(balance.toFixed()).times(xTokenPrice).toFixed())} available`
      : '-';
  }, [existingPosition, xToken, crossChainBalances, chain.xChainId, xTokenPrice]);

  const formattedDeposit = useMemo(() => {
    if (!existingPosition || existingPosition?.isLessThanOrEqualTo(0)) return;
    return xTokenPrice ? formatValue(existingPosition.times(xTokenPrice).toFixed()) : '-';
  }, [existingPosition, xTokenPrice]);

  return (
    <Grid $isSignedIn={isSignedIn} className={isLast ? '' : 'border-bottom'} onClick={e => setChainId(chain.xChainId)}>
      <ChainItemWrap>
        <Box pr="10px">
          <ChainLogo chain={chain} />
        </Box>
        <Typography fontWeight="bold" fontSize={14} color="inherit">
          {chain.name}
        </Typography>
      </ChainItemWrap>
      {isSignedIn ? (
        <Typography
          color="inherit"
          style={{ transition: 'all ease 0.3s', opacity: existingPosition?.isGreaterThan(0) ? 1 : 0.75 }}
          fontSize={existingPosition?.isGreaterThan(0) ? 14 : 12}
        >
          {existingPosition?.isGreaterThan(0) ? formattedDeposit : formattedWalletBalance}
        </Typography>
      ) : (
        <Typography>-</Typography>
      )}
    </Grid>
  );
};

const ChainList = ({ chainId, setChainId, chains, width }: ChainListProps) => {
  const relevantChains = chains || xChains;
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChains = React.useMemo(() => {
    if (searchQuery === '') return relevantChains;

    return relevantChains.filter(
      chain =>
        chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chain.xChainId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [relevantChains, searchQuery]);

  const sortedFilteredChains = React.useMemo(() => {
    return filteredChains.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }, [filteredChains]);

  return (
    <SelectorWrap $width={width}>
      <SearchInput
        type="text"
        placeholder={t`Search blockchains...`}
        autoComplete="off"
        value={searchQuery}
        tabIndex={isMobile ? -1 : 1}
        onChange={e => {
          setSearchQuery(e.target.value);
        }}
      />
      <ScrollHelper>
        <Grid mb="-10px" style={{ pointerEvents: 'none' }}>
          <HeaderText>
            <Trans>Blockchain</Trans>
          </HeaderText>
          <HeaderText>
            <Trans>Collateral</Trans>
          </HeaderText>
        </Grid>
        {sortedFilteredChains.map((chainItem, index) => (
          <Box key={index}>
            <ChainItem
              chain={chainItem}
              isActive={chainId === chainItem.xChainId}
              isLast={sortedFilteredChains.length === index + 1}
              setChainId={setChainId}
            />
          </Box>
        ))}
        {sortedFilteredChains.length === 0 && searchQuery !== '' && (
          <Typography textAlign="center" mt="20px" pb="22px">
            No blockchains found.
          </Typography>
        )}
      </ScrollHelper>
    </SelectorWrap>
  );
};

export default ChainList;
