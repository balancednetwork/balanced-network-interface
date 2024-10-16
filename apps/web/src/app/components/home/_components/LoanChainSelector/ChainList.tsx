import React, { useState } from 'react';

import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Box } from 'rebass';

import { ChainLogo } from '@/app/components/ChainLogo';
import { UnderlineText } from '@/app/components/DropdownText';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { HeaderText } from '@/app/components/Wallet/styledComponents';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { Typography } from '@/app/theme';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useDerivedCollateralInfo } from '@/store/collateral/hooks';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { formatBalance } from '@/utils/formatter';
import { getXChainType } from '@/xwagmi/actions';
import { xChains } from '@/xwagmi/constants/xChains';
import { xTokenMap } from '@/xwagmi/constants/xTokens';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { XChain, XChainId } from '@/xwagmi/types';
import { ChainItemWrap, Grid, ScrollHelper, SelectorWrap } from './styledComponents';

type ChainListProps = {
  chainId: XChainId;
  onChainIdChange: (chainId: XChainId) => void;
  chains?: XChain[];
  width: number | undefined;
};

type ChainItemProps = {
  chain: XChain;
  isLast: boolean;
  setChainId: (chain: XChainId) => void;
};

const ChainItem = ({ chain, setChainId, isLast }: ChainItemProps) => {
  const signedInWallets = useSignedInWallets();
  const isSignedIn = signedInWallets.some(wallet => wallet.xChainId === chain.xChainId);
  const crossChainBalances = useCrossChainWalletBalances();

  const xChainType = getXChainType(chain.xChainId);
  const xConnect = useXConnect();
  const xConnectors = useXConnectors(xChainType);

  const handleConnect = () => {
    handleConnectWallet(xChainType, xConnectors, xConnect);
  };

  const bnUSD = xTokenMap[chain.xChainId].find(token => token.symbol === 'bnUSD');

  return (
    <Grid
      $isSignedIn={isSignedIn}
      className={isLast ? '' : 'border-bottom'}
      onClick={e => (isSignedIn ? setChainId(chain.xChainId) : handleConnect())}
    >
      <ChainItemWrap>
        <Box pr="10px">
          <ChainLogo chain={chain} />
        </Box>
        <Typography fontWeight="bold" fontSize={14} color="inherit">
          {chain.name}
        </Typography>
      </ChainItemWrap>
      {isSignedIn ? (
        <Typography color="inherit" style={{ transition: 'all ease 0.3s' }}>
          {`${
            crossChainBalances[chain.xChainId]?.[bnUSD?.address || '']
              ? formatBalance(crossChainBalances[chain.xChainId]?.[bnUSD?.address || '']?.toFixed(), 1).replace(
                  '.00',
                  '',
                )
              : 0
          }`}
          {' bnUSD'}
        </Typography>
      ) : (
        <Typography color="primaryBright">
          <UnderlineText>Connect</UnderlineText>
        </Typography>
      )}
    </Grid>
  );
};

const ChainList = ({ onChainIdChange, chains, width }: ChainListProps) => {
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
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
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
            <Trans>Wallet</Trans>
          </HeaderText>
        </Grid>
        {sortedFilteredChains.map((chainItem, index) => (
          <Box key={index}>
            <ChainItem
              chain={chainItem}
              isLast={sortedFilteredChains.length === index + 1}
              setChainId={onChainIdChange}
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
