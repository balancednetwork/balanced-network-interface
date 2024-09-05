import { Typography } from '@/app/theme';
import useKeyPress from '@/hooks/useKeyPress';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useXBalancesByToken } from '@/store/wallet/hooks';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import { Trans, t } from '@lingui/macro';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Box } from 'rebass';
import SearchInput from '../SearchModal/SearchInput';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import {
  BalanceAndValueWrap,
  DashGrid,
  HeaderText,
  List,
  WalletButton,
  WalletButtons,
  WalletContent,
  WalletMenu,
  WalletWrap,
  walletBreakpoint,
} from './styledComponents';

interface WalletProps {
  close: () => void;
}

const Wallet = ({ close }: WalletProps) => {
  const balances = useXBalancesByToken();
  const toggleWalletModal = useWalletModalToggle();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();
  const handleEscape = useKeyPress('Escape');
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);

  const handleChangeWallet = () => {
    close();
    toggleWalletModal();
  };

  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    close();
    await xDisconnectAll();
  };

  const handleSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const searchedXChainId = React.useMemo(
    () => Object.values(xChainMap).find(chain => chain.name.toLowerCase() === searchQuery.toLowerCase())?.xChainId,
    [searchQuery],
  );

  useEffect(() => {
    if (handleEscape) {
      close();
    }
  }, [handleEscape, close]);

  const filteredBalances = React.useMemo(() => {
    if (!balances) return [];
    if (searchQuery === '') return balances;

    return balances.filter(
      balance =>
        balance.baseToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        balance.baseToken.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.keys(balance.xTokenAmounts).some(x =>
          xChainMap[x].name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [balances, searchQuery]);

  const sortedFilteredBalances = React.useMemo(() => {
    return filteredBalances.sort((a, b) => {
      if (b.value && a.value?.isLessThan(b.value)) return 1;
      if (a.value && b.value?.isLessThan(a.value)) return -1;
      return 0;
    });
  }, [filteredBalances]);

  return (
    <WalletWrap>
      <WalletMenu>
        <Typography variant="h2" mr={'auto'}>
          <Trans>Wallet</Trans>
        </Typography>
        <WalletButtons>
          <WalletButton onClick={handleChangeWallet}>
            <Trans>Manage wallets</Trans>
          </WalletButton>
          <Typography padding={'0px 5px'}>{' | '}</Typography>
          <WalletButton onClick={handleDisconnectWallet}>
            <Trans>Sign out</Trans>
          </WalletButton>
        </WalletButtons>
      </WalletMenu>
      <WalletContent>
        <Box px="25px" marginBottom={'15px'}>
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t`Search assets`}
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            tabIndex={isMobile ? -1 : 1}
            onChange={handleSearchQuery}
          />
        </Box>
        <List>
          <DashGrid>
            <HeaderText>
              <Trans>Asset</Trans>
            </HeaderText>
            <BalanceAndValueWrap>
              <HeaderText>
                <Trans>Balance</Trans>
              </HeaderText>
              {isSmallScreen ? null : (
                <HeaderText>
                  <Trans>Value</Trans>
                </HeaderText>
              )}
            </BalanceAndValueWrap>
          </DashGrid>
          {sortedFilteredBalances.map((record, index) =>
            record.isBalanceSingleChain ? (
              <SingleChainBalanceItem
                key={index}
                baseToken={record.baseToken}
                networkBalance={record.xTokenAmounts}
                value={record.value}
                isLast={index === sortedFilteredBalances.length - 1}
              />
            ) : (
              <MultiChainBalanceItem
                key={index}
                baseToken={record.baseToken}
                balances={record.xTokenAmounts}
                value={record.value}
                total={record.total}
                searchedXChainId={searchedXChainId}
              />
            ),
          )}
          {sortedFilteredBalances.length === 0 && searchQuery !== '' && (
            <Typography padding={'30px 0 15px 0'} textAlign={'center'}>
              No assets found
            </Typography>
          )}
        </List>
      </WalletContent>
    </WalletWrap>
  );
};

export default Wallet;
