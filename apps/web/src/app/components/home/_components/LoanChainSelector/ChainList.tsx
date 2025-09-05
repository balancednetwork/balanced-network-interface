import React, { useEffect, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Box, Flex } from 'rebass';

import { ChainLogo } from '@/app/components/ChainLogo';
import { UnderlineText } from '@/app/components/DropdownText';
import CancelSearchButton from '@/app/components/SearchModal/CancelSearchButton';
import { SearchWrap } from '@/app/components/SearchModal/CurrencySearch';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { StyledHeaderText } from '@/app/pages/trade/bridge/_components/XChainList';
import { Typography } from '@/app/theme';
import { bnUSD } from '@/constants/tokens';
import useSortXChains from '@/hooks/useSortXChains';
import { useHasSignedIn, useSignedInWallets } from '@/hooks/useWallets';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { formatBalance } from '@/utils/formatter';
import { getXChainType } from '@balancednetwork/xwagmi';
import { xChains } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import { XChain, XChainId } from '@balancednetwork/xwagmi';
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
  const [isAwaitingSignIn, setAwaitingSignIn] = React.useState(false);
  const crossChainBalances = useCrossChainWalletBalances();
  const bnUSD = xTokenMap[chain.xChainId].find(token => token.symbol === 'bnUSD');

  const xChainType = getXChainType(chain.xChainId);
  const xConnect = useXConnect();
  const xConnectors = useXConnectors(xChainType);

  const handleConnect = () => {
    handleConnectWallet(xChainType, xConnectors, xConnect);
  };

  const handleChainSelect = () => {
    if (isSignedIn) {
      setChainId(chain.xChainId);
    } else {
      setAwaitingSignIn(true);
      handleConnect();
    }
  };

  useEffect(() => {
    if (isAwaitingSignIn && isSignedIn) {
      setChainId(chain.xChainId);
      setAwaitingSignIn(false);
    }
  }, [isAwaitingSignIn, isSignedIn, setChainId, chain.xChainId]);

  return (
    <Grid $isSignedIn={isSignedIn} className={isLast ? '' : 'border-bottom'} onClick={handleChainSelect}>
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
  const hasSignedIn = useHasSignedIn();
  const { sortBy, handleSortSelect, sortData } = useSortXChains(
    hasSignedIn ? { key: 'value', order: 'DESC' } : { key: 'symbol', order: 'ASC' },
    bnUSD[1],
  );

  const filteredChains = React.useMemo(() => {
    if (searchQuery === '') return relevantChains;

    return relevantChains.filter(
      chain =>
        chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chain.xChainId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [relevantChains, searchQuery]);

  const sortedFilteredChains = React.useMemo(() => {
    return sortData(filteredChains, bnUSD[1]);
  }, [filteredChains, sortData]);

  return (
    <SelectorWrap $width={width}>
      <SearchWrap>
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
        <CancelSearchButton isActive={searchQuery.length > 0} onClick={() => setSearchQuery('')}></CancelSearchButton>
      </SearchWrap>

      <ScrollHelper>
        <Typography mb="15px">
          <Trans>
            Loans use bnUSD (old). If you need some to repay your loan, visit the Migrate tab on the Trade page.
          </Trans>
        </Typography>
        <Flex width="100%" justifyContent="space-between">
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'name' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'name',
                order: sortBy.order === 'DESC' ? 'ASC' : 'DESC',
              })
            }
          >
            <span>
              <Trans>Blockchain</Trans>
            </span>
          </StyledHeaderText>
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'value' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'value',
              })
            }
            style={{ cursor: 'pointer' }}
          >
            <span>
              <Trans>Wallet</Trans>
            </span>
          </StyledHeaderText>
        </Flex>
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
