import React, { useState } from 'react';

import { Box } from 'rebass';

import { ChainLogo } from 'app/components/ChainLogo';
import { XChainId, XChain, XWalletType } from 'app/pages/trade/bridge/types';
import { xChainMap, xChains } from 'app/pages/trade/bridge/_config/xChains';
import SearchInput from 'app/components/SearchModal/SearchInput';
import { Trans, t } from '@lingui/macro';
import { ChainItemWrap, Grid, ScrollHelper, SelectorWrap } from './styledComponents';
import { HeaderText } from 'app/components/Wallet/styledComponents';
import { Typography } from 'app/theme';
import { UnderlineText } from 'app/components/DropdownText';
import { useWalletModal } from 'store/application/hooks';
import { useSignedInWallets } from 'app/pages/trade/bridge/_hooks/useWallets';
import { useCrossChainWalletBalances } from 'store/wallet/hooks';
import { isMobile } from 'react-device-detect';
import { useArchwayContext } from 'packages/archway/ArchwayProvider';
import { useHavahContext } from 'packages/havah/HavahProvider';
import { useDerivedCollateralInfo } from 'store/collateral/hooks';
import { formatBalance } from 'utils/formatter';

type ChainListProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  chains?: XChain[];
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
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const { connectToWallet: connectToHavah } = useHavahContext();
  const [, setWalletModal] = useWalletModal();
  const crossChainBalances = useCrossChainWalletBalances();
  const { sourceChain: collateralChain } = useDerivedCollateralInfo();

  const [waitingSignIn, setWaitingSignIn] = useState<XChainId | null>(null);

  const handleConnect = (xChain: XChain) => {
    setWaitingSignIn(xChain.xChainId);
    if (xChain.xWalletType === XWalletType.COSMOS) {
      connectKeplr();
    } else if (xChain.xWalletType === XWalletType.HAVAH) {
      connectToHavah();
    } else {
      setWalletModal(xChain.xWalletType);
    }
  };

  React.useEffect(() => {
    if (waitingSignIn && signedInWallets.some(wallet => wallet.xChainId === waitingSignIn)) {
      setChainId(waitingSignIn);
      setWaitingSignIn(null);
    }
    return () => {
      if (waitingSignIn) {
        setWaitingSignIn(null);
      }
    };
  }, [signedInWallets, waitingSignIn, setChainId]);

  React.useEffect(() => {
    if (!isSignedIn && !waitingSignIn) {
      setChainId(collateralChain);
    }
  }, [isSignedIn, waitingSignIn, setChainId, collateralChain]);

  return (
    <Grid
      $isSignedIn={isSignedIn}
      className={isLast ? '' : 'border-bottom'}
      onClick={e => (isSignedIn ? setChainId(chain.xChainId) : handleConnect(chain))}
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
            crossChainBalances[chain.xChainId]?.[xChainMap[chain.xChainId].contracts.bnUSD || '']
              ? formatBalance(
                  crossChainBalances[chain.xChainId]?.[xChainMap[chain.xChainId].contracts.bnUSD || '']?.toFixed(),
                  1,
                ).replace('.00', '')
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

const ChainList = ({ chainId, setChainId, chains }: ChainListProps) => {
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
    <SelectorWrap>
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
      <Grid mt="15px" mb="-10px" style={{ pointerEvents: 'none' }}>
        <HeaderText>
          <Trans>Blockchain</Trans>
        </HeaderText>
        <HeaderText>
          <Trans>Wallet</Trans>
        </HeaderText>
      </Grid>
      <ScrollHelper>
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
