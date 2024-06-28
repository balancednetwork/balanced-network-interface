import React, { RefObject, useEffect, useRef, useState } from 'react';
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
import { Typography } from 'app/theme';
import { Trans, t } from '@lingui/macro';
import bnJs from 'bnJs';
import { useWalletModalToggle } from 'store/application/hooks';
import { XWalletType } from 'app/pages/trade/bridge/types';
import SearchInput from '../SearchModal/SearchInput';
import useWallets from 'app/pages/trade/bridge/_hooks/useWallets';
import { isMobile } from 'react-device-detect';
import useArrowControl from 'hooks/useArrowControl';
import useKeyPress from 'hooks/useKeyPress';
import { useMedia } from 'react-use';
import { useCrossChainWalletBalances, useXBalancesByToken } from 'store/wallet/hooks';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import MultiChainBalanceItem from './MultiChainBalanceItem';

interface WalletProps {
  close: () => void;
}

const Wallet = ({ close }: WalletProps) => {
  const allWallets = useWallets();
  const balances = useXBalancesByToken();
  const toggleWalletModal = useWalletModalToggle();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();
  const handleEscape = useKeyPress('Escape');
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);

  // const { activeIndex, setActiveIndex } = useArrowControl(anchor !== null, filteredSortedTokens.length);

  const handleChangeWallet = () => {
    close();
    toggleWalletModal();

    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }
  };

  const handleDisconnectWallet = async () => {
    close();

    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }

    // disconnect function includes resetContractLedgerSettings, so put it below the transport.close()
    allWallets[XWalletType.ICON]?.disconnect();
    allWallets[XWalletType.COSMOS]?.disconnect();
    allWallets[XWalletType.EVM]?.disconnect();
  };

  useEffect(() => {
    if (handleEscape) {
      close();
    }
  }, [handleEscape, close]);

  const sortedBalances = React.useMemo(() => {
    if (!balances) return [];

    return balances.sort((a, b) => {
      if (b.value && a.value?.isLessThan(b.value)) return 1;
      if (a.value && b.value?.isLessThan(a.value)) return -1;
      return 0;
    });
  }, [balances]);

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
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search assets`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          tabIndex={isMobile ? -1 : 1}
          onChange={e => {
            setSearchQuery(e.target.value);
            // activeIndex === undefined && setActiveIndex(0);
          }}
        />
        <DashGrid marginTop={'15px'}>
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
        <List>
          {sortedBalances.map((record, index) =>
            record.isBalanceSingleChain ? (
              <SingleChainBalanceItem
                key={index}
                baseToken={record.baseToken}
                networkBalance={record.balances}
                value={record.value}
                isLast={index === balances.length - 1}
              />
            ) : (
              <MultiChainBalanceItem
                key={index}
                baseToken={record.baseToken}
                balances={record.balances}
                value={record.value}
                total={record.total}
              />
            ),
          )}
        </List>
      </WalletContent>
    </WalletWrap>
  );
};

export default Wallet;
