import React from 'react';

import { Box, Flex } from 'rebass';

import { ChainLogo } from 'app/pages/trade/bridge/_components/ChainLogo';
import { XChainId, XChain, XWalletType } from 'app/pages/trade/bridge/types';
import { xChainMap, xChains } from 'app/pages/trade/bridge/_config/xChains';
import SearchInput from 'app/components/SearchModal/SearchInput';
import { Trans, t } from '@lingui/macro';
import { ChainItemWrap, Grid, SelectorWrap } from './styledComponents';
import { HeaderText } from 'app/components/Wallet/styledComponents';
import { Typography } from 'app/theme';
import { UnderlineText } from 'app/components/DropdownText';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useWalletModal } from 'store/application/hooks';
import { useAllDerivedWallets, useSignedInWallets } from 'app/pages/trade/bridge/_hooks/useWallets';
import { useCrossChainWalletBalances } from 'store/wallet/hooks';

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
  const signedInWallets = useAllDerivedWallets();
  const isSignedIn = signedInWallets.some(wallet => wallet.xChainId === chain.xChainId);
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const [, setWalletModal] = useWalletModal();
  const crossChainBalances = useCrossChainWalletBalances();

  const handleConnect = (xChain: XChain) => {
    if (xChain.xWalletType === XWalletType.COSMOS) {
      connectKeplr();
    } else {
      setWalletModal(xChain.xWalletType);
    }
  };

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
              ? crossChainBalances[chain.xChainId]?.[xChainMap[chain.xChainId].contracts.bnUSD || '']
                  ?.toFixed(2, {
                    groupSeparator: ',',
                  })
                  .replace('.00', '')
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
  const sortedChains = relevantChains.sort((a, b) => (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1));

  return (
    <SelectorWrap>
      <SearchInput type="text" placeholder={t`Search blockchains...`} />
      <Grid mt="15px" mb="-10px" style={{ pointerEvents: 'none' }}>
        <HeaderText>
          <Trans>Blockchain</Trans>
        </HeaderText>
        <HeaderText>
          <Trans>Wallet</Trans>
        </HeaderText>
      </Grid>
      {sortedChains.map((chainItem, index) => (
        <Box key={index}>
          <ChainItem
            chain={chainItem}
            isActive={chainId === chainItem.xChainId}
            isLast={relevantChains.length === index + 1}
            setChainId={setChainId}
          />
        </Box>
      ))}
    </SelectorWrap>
  );
};

export default ChainList;
