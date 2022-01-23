import React, { useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useArrowControl from 'hooks/useArrowControl';
import useKeyPress from 'hooks/useKeyPress';
import { useRatesQuery } from 'queries/reward';
import { useAllTransactions } from 'store/transactions/hooks';
import { useBALNDetails, useWalletBalances } from 'store/wallet/hooks';
import { getTokenFromCurrencyKey } from 'types/adapter';

import { SearchInput } from '../SearchModal/CurrencySearch';
import BALNWallet from './wallets/BALNWallet';
import ICXWallet from './wallets/ICXWallet';
import SendPanel from './wallets/SendPanel';
import SICXWallet from './wallets/SICXWallet';
import { notificationCSS } from './wallets/utils';

const WalletUIs = {
  ICX: ICXWallet,
  sICX: SICXWallet,
  BALN: BALNWallet,
};

const walletBreakpoint = '499px';
const modalWalletBreakpoint = '400px';

const WalletAssets = styled.div`
  padding: 0 25px;

  input {
    font-size: 14px;
  }
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DashGrid = styled(Box)`
  display: grid;
  grid-template-columns: 2fr 3fr;
  grid-template-areas: 'asset balance&value';
  align-items: center;
  @media screen and (max-width: ${walletBreakpoint}) {
    grid-template-columns: 3fr 5fr;
  }
  & > * {
    justify-content: flex-end;
    text-align: right;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const DataText = styled(Typography)`
  font-size: 14px;
`;

const BalanceAndValueWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  ${DataText}, ${HeaderText} {
    width: 50%;
    @media screen and (max-width: ${walletBreakpoint}) {
      width: 100%;

      &.value {
        opacity: 0.7;
      }
    }
  }
`;

const List = styled(Box)`
  max-height: 260px;
  overflow-y: auto;
  padding: 0 25px;
  margin: 0 -25px;
`;

const ListItem = styled(DashGrid)<{ border?: boolean }>`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  transition: transform 0.2s ease-out;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  @media screen and (max-width: ${walletBreakpoint}) {
    padding: 15px 0;
  }
  & > div,
  ${BalanceAndValueWrap} > div {
    transition: color 0.2s ease;
  }

  &.active {
    transform: translate3d(4px, 0, 0);
    & > div,
    ${BalanceAndValueWrap} > div {
      color: ${({ theme }) => theme.colors.primary};
      &:before,
      &:after {
        background: ${({ theme }) => theme.colors.primary};
      }
    }
  }
`;

const AssetSymbol = styled.div<{ hasNotification?: boolean }>`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
  position: relative;

  ${({ hasNotification }) => hasNotification && notificationCSS}
  &:before, &:after {
    right: initial;
    left: -18px;
  }
`;

const ModalContent = styled(Box)`
  padding: 25px;
  width: 100%;

  button[role='tab'] {
    border-left: 0;
    border-top: 0;
    border-right: 0;
  }

  ${AssetSymbol} {
    &:before,
    &:after {
      display: none;
    }
  }

  @media screen and (max-width: ${modalWalletBreakpoint}) {
    padding: 15px;
  }
`;

const BoxPanelWithArrow = styled(BoxPanel)`
  position: relative;
  width: 100%;

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    top: 0;
    left: 34px;
    margin-top: -12px;
  }

  @media screen and (max-width: ${modalWalletBreakpoint}) {
    width: calc(100% + 30px);
    margin: 0 -15px -15px -15px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    padding: 15px;

    &:before {
      left: 50px;
    }
  }
`;

const Wallet = ({ setAnchor, anchor, ...rest }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const balances = useWalletBalances();
  const transactions = useAllTransactions();
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const details = useBALNDetails();
  const stakedBALN: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);
  const unstakingBALN: BigNumber = React.useMemo(() => details['Unstaking balance'] || new BigNumber(0), [details]);
  const totalBALN: BigNumber = React.useMemo(() => details['Total balance'] || new BigNumber(0), [details]);
  const isAvailable = stakedBALN.isGreaterThan(new BigNumber(0)) || unstakingBALN.isGreaterThan(new BigNumber(0));
  const { data: rates } = useRatesQuery();
  const { account } = useIconReact();
  const [searchQuery, setSearchQuery] = useState('');
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');
  const [isOpen, setOpen] = useState(false);

  const availableBALN = balances && <Typography>Available: {balances['BALN']?.dp(2).toFormat()}</Typography>;

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const filteredTokens = SUPPORTED_TOKENS_LIST.filter(token => {
    if (token.symbol === 'BALN') {
      return !totalBALN.dp(2).isZero();
    }
    return !balances[token.symbol!].dp(2).isZero();
  })
    .filter(token => {
      const symbol = token.symbol || '';
      const name = token.name || '';
      return (
        ((symbol || name) && symbol.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0) ||
        name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0
      );
    })
    .sort((a, b) => balances[b.symbol!].minus(balances[a.symbol!]).toNumber());

  const { activeIndex, setActiveIndex } = useArrowControl(!!anchor, filteredTokens?.length || 0);

  const showModal = useCallback(() => {
    setAnchor(null);
    setOpen(true);
  }, [setAnchor, setOpen]);

  //on enter press
  useEffect(() => {
    if (anchor && filteredTokens.length && enter) {
      showModal();
    }
  }, [anchor, activeIndex, enter, filteredTokens, filteredTokens.length, showModal]);

  useEffect(() => {
    if (anchor && escape) {
      setAnchor(null);
      setOpen(false);
    }
  }, [anchor, escape, setAnchor]);

  const WalletUI = WalletUIs[filteredTokens[activeIndex]?.symbol!] || SendPanel;

  const TokenInfo = ({ token }) => {
    return (
      <>
        <AssetSymbol hasNotification={token.symbol!.toLowerCase() === 'icx' && claimableICX.isGreaterThan(0)}>
          <CurrencyLogo currency={getTokenFromCurrencyKey(token.symbol)!} />
          <Typography fontWeight="bold">{token.symbol!}</Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div">
            {!account
              ? '-'
              : token.symbol!.toLowerCase() === 'baln'
              ? totalBALN.dp(2).toFormat()
              : balances[token.symbol!].dp(2).toFormat()}
            {token.symbol!.toLowerCase() === 'baln' && isAvailable && !isSmallScreen && <>{availableBALN}</>}
          </DataText>

          <DataText className="value" as="div">
            {!account || !rates || !rates[token.symbol!]
              ? '-'
              : token.symbol!.toLowerCase() === 'baln'
              ? `$${totalBALN.multipliedBy(rates[token.symbol!]).dp(2).toFormat()}`
              : `$${balances[token.symbol!].multipliedBy(rates[token.symbol!]).dp(2).toFormat()}`}
            {token.symbol!.toLowerCase() === 'baln' && isAvailable && isSmallScreen && <>{availableBALN}</>}
            {token.symbol!.toLowerCase() === 'baln' && isAvailable && rates && rates[token.symbol!] && (
              <>
                <Typography>${balances['BALN'].multipliedBy(rates[token.symbol!]).dp(2).toFormat()}</Typography>
              </>
            )}
          </DataText>
        </BalanceAndValueWrap>
      </>
    );
  };

  return (
    <>
      <WalletAssets>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={`Search assets`}
          autoComplete="off"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            activeIndex === undefined && setActiveIndex(0);
          }}
        />
        {filteredTokens?.length ? (
          <DashGrid marginTop={'15px'}>
            <HeaderText>Asset</HeaderText>
            <BalanceAndValueWrap>
              <HeaderText>Balance</HeaderText>
              {isSmallScreen ? null : <HeaderText>Value</HeaderText>}
            </BalanceAndValueWrap>
          </DashGrid>
        ) : null}

        <List>
          {filteredTokens.map((token, index, arr) => {
            return (
              <>
                <ListItem
                  className={index === activeIndex ? 'active' : ''}
                  key={token.symbol!}
                  border={index !== arr.length - 1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={showModal}
                >
                  <TokenInfo token={token} />
                </ListItem>
              </>
            );
          })}
        </List>
      </WalletAssets>
      {filteredTokens?.length ? (
        <Modal isOpen={isOpen} onDismiss={() => setOpen(false)}>
          <ModalContent>
            <DashGrid>
              <HeaderText>Asset</HeaderText>
              <BalanceAndValueWrap>
                <HeaderText>Balance</HeaderText>
                {isSmallScreen ? null : <HeaderText>Value</HeaderText>}
              </BalanceAndValueWrap>
            </DashGrid>
            <ListItem border={false}>
              <TokenInfo token={filteredTokens[activeIndex]} />
            </ListItem>
            <BoxPanelWithArrow bg="bg3">
              {activeIndex >= 0 &&
                isOpen &&
                (filteredTokens[activeIndex].symbol!.toLocaleLowerCase() === 'icx' ? (
                  <WalletUI currency={filteredTokens[activeIndex]} claimableICX={claimableICX} />
                ) : (
                  <WalletUI currency={filteredTokens[activeIndex]} />
                ))}
            </BoxPanelWithArrow>
          </ModalContent>
        </Modal>
      ) : (
        <Typography padding="25px 0" width={'100%'} textAlign="center">
          No assets found.
        </Typography>
      )}
    </>
  );
};

export default Wallet;
