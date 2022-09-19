import React, { useEffect, useMemo, useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Trans } from '@lingui/macro';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import '@reach/tabs/styles.css';
import {
  NULL_CONTRACT_ADDRESS,
  SUPPORTED_TOKENS_LIST,
  COMBINED_TOKENS_LIST,
  COMBINED_TOKENS_MAP_BY_ADDRESS,
  HIGH_PRICE_ASSET_DP,
} from 'constants/tokens';
import { useRatesWithOracle } from 'queries/reward';
import { useTokenListConfig } from 'store/lists/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances, useBALNDetails } from 'store/wallet/hooks';
import { isDPZeroCA, toFraction } from 'utils';

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

function useAddresses() {
  const tokenListConfig = useTokenListConfig();
  const addresses = useMemo(() => {
    return tokenListConfig.community
      ? COMBINED_TOKENS_LIST.map(currency => currency.address)
      : SUPPORTED_TOKENS_LIST.map(currency => currency.address);
  }, [tokenListConfig]);

  return useMemo(() => {
    const icxAddressIndex = addresses.indexOf(NULL_CONTRACT_ADDRESS);
    const icxAddress = addresses.splice(icxAddressIndex, 1)[0];
    addresses.splice(0, 0, icxAddress);
    return addresses;
  }, [addresses]);
}

const WalletPanel = () => {
  const addresses = useAddresses();
  const balances = useWalletBalances();
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const details = useBALNDetails();
  const stakedBALN: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);
  const unstakingBALN: BigNumber = React.useMemo(() => details['Unstaking balance'] || new BigNumber(0), [details]);
  const totalBALN: BigNumber = React.useMemo(() => details['Total balance'] || new BigNumber(0), [details]);
  const isAvailable = stakedBALN.isGreaterThan(new BigNumber(0)) || unstakingBALN.isGreaterThan(new BigNumber(0));
  const isSmallScreen = useMedia(`(max-width: 499px)`);

  const balnAddress = bnJs.BALN.address;

  // rates: using symbol as key?
  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const availableBALN = balances && balances[balnAddress] && (
    <Typography color="rgba(255,255,255,0.75)">
      <Trans>Available</Trans>: {balances[balnAddress].toFixed(2, { groupSeparator: ',' })}
    </Typography>
  );

  return (
    <BoxPanel bg="bg2" minHeight={195}>
      <Typography variant="h2" mb={5}>
        <Trans>Wallet</Trans>
      </Typography>

      {balances && Object.keys(balances).filter(address => balances[address].toFixed(2) !== '0.00').length ? (
        <Wrapper>
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

          <List>
            <Accordion collapsible>
              {addresses
                .filter(address => {
                  if (address === balnAddress) {
                    return !totalBALN.dp(2).isZero();
                  }
                  return !isDPZeroCA(balances[address], HIGH_PRICE_ASSET_DP[address] || 2);
                })
                .sort((a, b) =>
                  a !== NULL_CONTRACT_ADDRESS && b !== NULL_CONTRACT_ADDRESS
                    ? COMBINED_TOKENS_MAP_BY_ADDRESS[a].symbol!.localeCompare(COMBINED_TOKENS_MAP_BY_ADDRESS[b].symbol!)
                    : 1,
                )
                .map((address, index, arr) => {
                  const currency = balances[address].currency;
                  const symbol = currency.symbol;
                  const WalletUI = symbol ? WalletUIs[symbol] ?? SendPanel : SendPanel;
                  return (
                    <AccordionItem key={symbol}>
                      <StyledAccordionButton currency={symbol}>
                        <ListItem border={index !== arr.length - 1}>
                          <AssetSymbol>
                            <CurrencyLogo currency={currency} />
                            <Typography fontSize={16} fontWeight="bold">
                              {symbol}
                            </Typography>
                          </AssetSymbol>

                          <BalanceAndValueWrap>
                            <DataText as="div">
                              {!account
                                ? '-'
                                : address === balnAddress
                                ? totalBALN.dp(2).toFormat()
                                : balances[address].toFixed(HIGH_PRICE_ASSET_DP[address] || 2, { groupSeparator: ',' })}
                              {address === balnAddress && isAvailable && !isSmallScreen && <>{availableBALN}</>}
                            </DataText>

                            <StyledDataText
                              as="div"
                              hasNotification={address === bnJs.ICX.address && claimableICX.isGreaterThan(0)}
                            >
                              {!account || !rates || !symbol || !rates[symbol] || !rateFracs
                                ? '-'
                                : address === balnAddress
                                ? `$${totalBALN.multipliedBy(rates[symbol]).dp(2).toFormat()}`
                                : `$${balances[address]
                                    .multiply(rateFracs[symbol])
                                    .toFixed(2, { groupSeparator: ',' })}`}
                              {address === balnAddress && isAvailable && isSmallScreen && <>{availableBALN}</>}
                              {address === balnAddress &&
                                isAvailable &&
                                !isSmallScreen &&
                                rateFracs &&
                                symbol &&
                                rateFracs[symbol] && (
                                  <>
                                    <Typography color="rgba(255,255,255,0.75)">
                                      $
                                      {balances[balnAddress]
                                        .multiply(rateFracs[symbol])
                                        .toFixed(2, { groupSeparator: ',' })}
                                    </Typography>
                                  </>
                                )}
                            </StyledDataText>
                          </BalanceAndValueWrap>
                        </ListItem>
                      </StyledAccordionButton>

                      <StyledAccordionPanel hidden={false}>
                        <BoxPanel bg="bg3">
                          {address === bnJs.ICX.address ? (
                            <WalletUI currency={currency} claimableICX={claimableICX} />
                          ) : (
                            <WalletUI currency={currency} />
                          )}
                        </BoxPanel>
                      </StyledAccordionPanel>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </List>
        </Wrapper>
      ) : (
        <Wrapper>
          <Typography textAlign="center" paddingTop={'20px'}>
            <Trans>No assets available.</Trans>
          </Typography>
        </Wrapper>
      )}
    </BoxPanel>
  );
};

export default WalletPanel;

const AssetSymbol = styled.div`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
`;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 3fr 5fr;
  grid-template-areas: 'asset balance&value';
  align-items: center;
  white-space: nowrap;

  ${({ theme }) => theme.mediaWidth.up500`
    grid-template-columns: 1fr 3fr;
  `}

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;

  &:last-of-type {
    padding-right: 25px;
  }
`;

const DataText = styled(Typography)`
  font-size: 16px;
`;

const StyledDataText = styled(DataText)<{ hasNotification?: boolean }>`
  padding-right: 25px;
  position: relative;

  &:before,
  &:after {
    content: '';
    width: 2px;
    height: 10px;
    background: #d5d7db;
    display: inline-block;
    position: absolute;
    top: -4px;
    transition: all ease 0.2s;

    ${({ theme }) => theme.mediaWidth.up500`
      top: 7px;
    `}
  }

  &:before {
    transform: rotate(45deg);
    right: 2px;
  }

  &:after {
    transform: rotate(-45deg);
    right: 8px;
  }

  ${({ hasNotification }) => hasNotification && notificationCSS}
  ${({ hasNotification }) =>
    hasNotification &&
    css`
      &:before,
      &:after {
        top: -4px;
        ${({ theme }) => theme.mediaWidth.up500`
          top: 7px;
        `}
      }
    `}
`;

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
`;

const StyledAccordionPanel = styled(AccordionPanel)`
  overflow: hidden;
  max-height: 0;
  transition: all ease-in-out 0.5s;
  &[data-state='open'] {
    max-height: 400px;
  }
`;

const BalanceAndValueWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  ${DataText}, ${StyledDataText}, ${HeaderText} {
    width: 100%;

    ${({ theme }) => theme.mediaWidth.up500`
      width: 50%;
    `}
  }

  ${DataText} {
    padding-right: 25px;

    ${({ theme }) => theme.mediaWidth.up500`
      padding-right: 0;
    `}
  }

  ${StyledDataText} {
    color: #d5d7db;
    font-size: 14px;
    padding-right: 25px;

    ${({ theme }) => theme.mediaWidth.up500`
      font-size: 16px;
      color: ${theme.colors.text};
    `}
  }
`;

const ListItem = styled(DashGrid)<{ border?: boolean }>`
  padding: 15px 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};

  ${({ theme }) => theme.mediaWidth.up500`
    padding: 20px 0;
  `}

  & > div,
  ${BalanceAndValueWrap} > div {
    transition: color 0.2s ease;
  }

  :hover {
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

const StyledAccordionButton = styled(AccordionButton)<{ currency?: string }>`
  width: 100%;
  appearance: none;
  background: 0;
  border: 0;
  box-shadow: none;
  padding: 0;
  position: relative;

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    transition-delay: 200ms;
    transform: translate3d(0, 20px, 0);
    opacity: 0;
    pointer-events: none;
    bottom: 0;
    ${({ currency = 'ICX' }) =>
      currency === 'ICX'
        ? 'left: 37px'
        : currency === 'sICX'
        ? 'left: 42px'
        : currency === 'bnUSD'
        ? 'left: 47px'
        : currency === 'BALN'
        ? 'left: 43px'
        : 'left: 40px'}
  }

  &[aria-expanded='false'] {
    & > ${ListItem} {
      transition: border-bottom ease-out 50ms 480ms;
    }
  }

  &[aria-expanded='true'] {
    &:before {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    & > ${ListItem} {
      border-bottom: 1px solid transparent;

      & > div,
      ${BalanceAndValueWrap} > div {
        color: ${({ theme }) => theme.colors.primary};

        &:before,
        &:after {
          background: ${({ theme }) => theme.colors.primary};
          width: 2px;
          height: 10px;
          border-radius: 0;
          animation: none;
        }

        &:before {
          transform: rotate(135deg);
          right: 2px;
        }

        &:after {
          transform: rotate(-135deg);
          right: 8px;
        }
      }
    }
  }
`;

const Wrapper = styled.div``;
