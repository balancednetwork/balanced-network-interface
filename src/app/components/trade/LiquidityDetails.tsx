import React, { useEffect, useMemo, useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Percent } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { omit } from 'lodash-es';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import CurrencyLogo from 'app/components/CurrencyLogo';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowDownIcon } from 'assets/icons/arrow-line.svg';
import bnJs from 'bnJs';
import { MINIMUM_B_BALANCE_TO_SHOW_POOL, ZERO } from 'constants/index';
import { BIGINT_ZERO, FRACTION_ONE, FRACTION_ZERO } from 'constants/misc';
import { BalanceData, useAvailablePairs, useBalances, useSuppliedTokens } from 'hooks/useV2Pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useRewards } from 'store/reward/hooks';
import { useChangeWithdrawnValue, useStakedLPPercent, useWithdrawnPercent } from 'store/stakedLP/hooks';
import { tryParseAmount } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useTrackedTokenPairs } from 'store/user/hooks';
import { useCurrencyBalances, useHasEnoughICX } from 'store/wallet/hooks';
import { multiplyCABN, toFraction, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import Spinner from '../Spinner';
import StakeLPPanel from './StakeLPPanel';
import { stakedFraction, withdrawMessage } from './utils';

function getRate(pair: Pair, balance: BalanceData): Fraction {
  //When balance = 0, use stakedLPBalance to calculate rate
  if (pair.totalSupply && JSBI.greaterThan(pair.totalSupply.quotient, BIGINT_ZERO) && balance) {
    const amount = (balance?.stakedLPBalance ? balance.balance.add(balance.stakedLPBalance) : balance.balance).divide(
      pair.totalSupply,
    );
    return new Fraction(amount.numerator, amount.denominator);
  }
  return FRACTION_ZERO;
}

function getABBalance(pair: Pair, balance: BalanceData) {
  const rate = getRate(pair, balance);

  return [pair.reserve0.multiply(rate), pair.reserve1.multiply(rate)];
}

function getShareReward(pair: Pair, balance: BalanceData, totalReward: BigNumber) {
  const rate = getRate(pair, balance);
  const totalRewardFrac = totalReward ? toFraction(totalReward) : FRACTION_ZERO;

  return {
    share: rate,
    reward: totalRewardFrac.multiply(rate),
  };
}

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');

  const { account } = useIconReact();

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const rewards = useRewards();

  // prevent accordion expanded on mounted
  const [isHided, setIsHided] = useState(true);

  const queuePair = pairs[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueBalance = balances[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueReward = rewards[BalancedJs.utils.POOL_IDS.sICXICX];

  const shouldShowQueue =
    queuePair &&
    queueBalance &&
    (JSBI.greaterThan(queueBalance.balance.quotient, BIGINT_ZERO) ||
      (queueBalance.balance1 && JSBI.greaterThan(queueBalance.balance1.quotient, BIGINT_ZERO)));

  if (!account || Object.keys(pairs).length === 0) return null;

  const pairsWithoutQ = omit(pairs, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const balancesWithoutQ = omit(balances, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const userPools = Object.keys(pairsWithoutQ).filter(
    poolId =>
      balances[poolId] &&
      (Number(balances[poolId].balance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL ||
        Number(balances[poolId].stakedLPBalance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL),
  );

  const sortedPairs = userPools
    .map(poolId => {
      const pair: Pair = pairsWithoutQ[poolId];

      if (pair.baseAddress === pair.token0.address) return pair;
      return new Pair(pair.reserve1, pair.reserve0, {
        poolId: pair.poolId,
        totalSupply: pair.totalSupply?.quotient.toString(),
        baseAddress: pair.baseAddress,
      });
    })
    .reduce((acc, pair) => {
      if (pair.poolId && pair.poolId > 0) acc[pair.poolId] = pair;
      return acc;
    }, {});

  return shouldShowQueue || userPools.length ? (
    <BoxPanel bg="bg2" mb={10}>
      <Typography variant="h2" mb={5}>
        <Trans>Liquidity details</Trans>
      </Typography>

      <TableWrapper>
        <DashGrid>
          <HeaderText>
            <Trans>Pool</Trans>
          </HeaderText>
          <HeaderText>
            <Trans>Your supply</Trans>
          </HeaderText>
          {upSmall && (
            <HeaderText>
              <Trans>Pool share</Trans>
            </HeaderText>
          )}
          {upSmall && (
            <HeaderText>
              <Trans>Daily rewards</Trans>
            </HeaderText>
          )}
          <HeaderText></HeaderText>
        </DashGrid>

        <Accordion collapsible>
          {shouldShowQueue && (
            <StyledAccordionItem key={BalancedJs.utils.POOL_IDS.sICXICX} border={userPools.length !== 0}>
              <StyledAccordionButton onClick={() => setIsHided(false)}>
                <PoolRecordQ balance={queueBalance} pair={queuePair} totalReward={queueReward} />
              </StyledAccordionButton>
              <StyledAccordionPanel hidden={isHided}>
                <StyledBoxPanel bg="bg3">
                  <WithdrawModalQ balance={queueBalance} pair={queuePair} />
                </StyledBoxPanel>
              </StyledAccordionPanel>
            </StyledAccordionItem>
          )}
          {balancesWithoutQ &&
            userPools.map((poolId, index, arr) => (
              <StyledAccordionItem key={poolId} border={index !== arr.length - 1}>
                <StyledAccordionButton onClick={() => setIsHided(false)}>
                  <PoolRecord
                    poolId={parseInt(poolId)}
                    balance={balances[poolId]}
                    pair={sortedPairs[poolId]}
                    totalReward={rewards[poolId]}
                  />
                </StyledAccordionButton>
                <StyledAccordionPanel hidden={isHided}>
                  <StyledBoxPanel bg="bg3">
                    <StakeLPPanel poolId={parseInt(poolId)} />
                    <WithdrawModal poolId={parseInt(poolId)} balance={balances[poolId]} pair={sortedPairs[poolId]} />
                  </StyledBoxPanel>
                </StyledAccordionPanel>
              </StyledAccordionItem>
            ))}
        </Accordion>
      </TableWrapper>
    </BoxPanel>
  ) : null;
}

const TableWrapper = styled.div``;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 5fr;
  gap: 10px;
  grid-template-areas: 'name supply action';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }

  ${({ theme }) => theme.mediaWidth.upSmall`
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-areas: 'name supply share rewards action';
  `}
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DataText = styled(Box)`
  font-size: 16px;
`;
const StyledArrowDownIcon = styled(ArrowDownIcon)`
  width: 10px;
  margin-left: 10px;
  margin-top: 10px;
  transition: transform 0.3s ease;
`;
const StyledDataText = styled(Flex)`
  font-weight: bold;
`;

const StyledBoxPanel = styled(BoxPanel)`
  display: flex;
  margin-bottom: 20px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upSmall`
     flex-direction: row;
  `}
`;

const StyledAccordionItem = styled(AccordionItem)<{ border?: boolean }>`
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  transition: border-bottom ease-in-out 50ms 480ms;
`;
const ListItem = styled(DashGrid)`
  padding: 20px 0;
  color: #ffffff;
`;

const OptionButton = styled(Box)`
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.bg2};
  border: 2px solid #144a68;
  transition: border 0.3s ease;
  padding: 10px;

  &[disabled] {
    background: rgba(255, 255, 255, 0.15);
    cursor: default;
    pointer-events: none;
  }

  :hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    transition: border 0.2s ease;
  }

  > svg,
  img {
    margin-bottom: 10px;
  }
`;

const StyledAccordionButton = styled(AccordionButton)`
  background-color: transparent;
  width: 100%;
  border: none;
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
    transform: translate3d(0, 20px, 0);
    opacity: 0;
    pointer-events: none;
    bottom: 0;
    left: 30px;
  }
  &:hover {
    & > ${ListItem} {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        path {
          stroke: ${({ theme }) => theme.colors.primary} !important;
        }
      }
    }
  }
  &[aria-expanded='true'] {
    &:before {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    & > ${ListItem} {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        & > svg {
          transform: rotateX(180deg);

          path {
            stroke: ${({ theme }) => theme.colors.primary} !important;
          }
        }
      }
    }
  }
`;

const StyledAccordionPanel = styled(AccordionPanel)`
  overflow: hidden;
  max-height: 0;
  transition: all ease-in-out 0.5s;
  &[data-state='open'] {
    max-height: 100%;
    ${({ theme }) => theme.mediaWidth.upSmall`
      max-height: 400px;
    `}
  }
`;

const PoolRecord = ({
  poolId,
  pair,
  balance,
  totalReward,
}: {
  pair: Pair;
  balance: BalanceData;
  poolId: number;
  totalReward: BigNumber;
}) => {
  const upSmall = useMedia('(min-width: 800px)');
  const stakedLPPercent = useStakedLPPercent(poolId);

  const { percent, baseValue, quoteValue } = useWithdrawnPercent(poolId) || {};
  const { share, reward } = getShareReward(pair, balance, totalReward);
  const [aBalance, bBalance] = getABBalance(pair, balance);
  const lpBalance = useSuppliedTokens(poolId, aBalance.currency, bBalance.currency);

  const totalSupply = (stakedValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) =>
    !!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue;

  const baseCurrencyTotalSupply = totalSupply(baseValue, lpBalance?.base);
  const quoteCurrencyTotalSupply = totalSupply(quoteValue, lpBalance?.quote);

  const stakedFractionValue = stakedFraction(stakedLPPercent);

  return (
    <>
      <ListItem>
        <StyledDataText>
          <DataText>{`${aBalance.currency.symbol || '...'} / ${bBalance.currency.symbol || '...'}`}</DataText>
          <StyledArrowDownIcon />
        </StyledDataText>
        <DataText>
          {`${baseCurrencyTotalSupply?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
            aBalance.currency.symbol || '...'
          }`}
          <br />
          {`${quoteCurrencyTotalSupply?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
            bBalance.currency.symbol || '...'
          }`}
        </DataText>

        {upSmall && (
          <DataText>{`${
            (baseValue?.equalTo(0) || quoteValue?.equalTo(0)) && percent?.isGreaterThan(ZERO)
              ? share.multiply(100)?.toFixed(4, { groupSeparator: ',' }) || '---'
              : ((Number(baseCurrencyTotalSupply?.toFixed()) * 100) / Number(pair?.reserve0.toFixed())).toFixed(4)
          }%`}</DataText>
        )}
        {upSmall && (
          <DataText>
            {reward?.equalTo(FRACTION_ZERO)
              ? 'N/A'
              : reward?.multiply(stakedFractionValue)
              ? `~ ${reward?.multiply(stakedFractionValue).divide(100).toFixed(2, { groupSeparator: ',' })} BALN`
              : 'N/A'}
          </DataText>
        )}
      </ListItem>
    </>
  );
};

const PoolRecordQ = ({ balance, pair, totalReward }: { balance: BalanceData; pair: Pair; totalReward: BigNumber }) => {
  const upSmall = useMedia('(min-width: 800px)');

  const { share, reward } = getShareReward(pair, balance, totalReward);

  return (
    <ListItem>
      <StyledDataText>
        <DataText>{`${balance.balance.currency.symbol || '...'} / ${
          balance.balance1?.currency.symbol || '...'
        }`}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>

      <DataText>
        <Typography fontSize={16}>{`${balance.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          balance.balance.currency.symbol || '...'
        }`}</Typography>
        <Typography color="text1">{`${balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          balance.balance1?.currency.symbol || '...'
        }`}</Typography>
      </DataText>
      {upSmall && <DataText>{`${share.multiply(100).toFixed(2) || '---'}%`}</DataText>}
      {upSmall && <DataText>{`~ ${reward.toFixed(2, { groupSeparator: ',' }) || '---'} BALN`}</DataText>}
    </ListItem>
  );
};

const WithdrawModalQ = ({ balance, pair }: { pair: Pair; balance: BalanceData }) => {
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleCancelOrder = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Dex.cancelSicxIcxOrder()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: t`Withdrawing ICX...`,
            summary: t`${balance.balance?.toFixed(2, { groupSeparator: ',' }) || '...'} ICX added to your wallet.`,
          },
        );
        toggleOpen1();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);

        changeShouldLedgerSign(false);
      });
  };

  const handleWithdrawEarnings = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    bnJs
      .inject({ account })
      .Dex.withdrawSicxEarnings()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: t`Withdrawing sICX...`,
            summary: t`${balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX added to your wallet.`,
          },
        );
        toggleOpen2();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const [open1, setOpen1] = React.useState(false);
  const toggleOpen1 = () => {
    if (shouldLedgerSign) return;

    setOpen1(!open1);
  };
  const handleOption1 = () => {
    toggleOpen1();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
    if (shouldLedgerSign) return;

    setOpen2(!open2);
  };
  const handleOption2 = () => {
    toggleOpen2();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Flex flexDirection="column" alignItems="center" margin="0 auto">
        <Typography variant="h3" mb={3}>
          <Trans>Withdraw:</Trans>&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">{`${pair.token0.symbol || '...'} / ${
            pair.token1.symbol || '...'
          }`}</Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton
            disabled={JSBI.equal(balance.balance1?.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption2}
            mr={2}
          >
            <CurrencyLogo currency={balance.balance1?.currency} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX
            </Typography>
          </OptionButton>

          <OptionButton
            disabled={JSBI.equal(balance.balance.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption1}
          >
            <CurrencyLogo currency={balance.balance.currency} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ICX
            </Typography>
          </OptionButton>
        </Flex>
      </Flex>

      <Modal isOpen={open1} onDismiss={toggleOpen1}>
        <ModalContent>
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            <Trans>Withdraw liquidity?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {balance.balance.toFixed(2, { groupSeparator: ',' }) || '...'} {balance.balance.currency.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen1}>Cancel</TextButton>
                <Button onClick={handleCancelOrder} disabled={!hasEnoughICX}>
                  <Trans>Withdraw</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>

      <Modal isOpen={open2} onDismiss={toggleOpen2}>
        <ModalContent>
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            <Trans>Withdraw sICX?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'}{' '}
            {balance.balance1?.currency.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen2}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleWithdrawEarnings} disabled={!hasEnoughICX}>
                  <Trans>Withdraw</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

const Wrapper = styled(Flex)`
  padding-left: 0;
  margin-left: 0;
  margin-top: 40px;
  flex-direction: column;
  border-left: none;

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding-left: 35px;
    margin-left: 35px;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    margin-top: 0;
  `}
`;

const WithdrawModal = ({ pair, balance, poolId }: { pair: Pair; balance: BalanceData; poolId: number }) => {
  const { account } = useIconReact();
  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [pair.token0, pair.token1], [pair]),
  );
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const onChangeWithdrawnValue = useChangeWithdrawnValue();

  const [{ typedValue, independentField, inputType, portion }, setState] = React.useState<{
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
    portion: number;
  }>({
    typedValue: '',
    independentField: Field.CURRENCY_A,
    inputType: 'text',
    portion: 0,
  });

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;
  const price =
    independentField === Field.CURRENCY_A ? pair.token0Price || FRACTION_ONE : pair.token1Price || FRACTION_ONE;

  let parsedAmount: { [field in Field]?: CurrencyAmount<Currency> }, formattedAmounts;

  const percent = useMemo(() => new Percent(Math.floor(portion * 100), 10_000), [portion]);
  const stakedLPPercent = useStakedLPPercent(poolId);
  const [aBalance, bBalance] = getABBalance(pair, balance);
  const availablePercent = new BigNumber(100).minus(stakedLPPercent).abs();
  const availableBase = aBalance.multiply(availablePercent.toFixed(0)).divide(100);
  const availableQuote = bBalance.multiply(availablePercent.toFixed(0)).divide(100);

  if (inputType === 'slider') {
    parsedAmount = {
      [Field.CURRENCY_A]: availableBase?.multiply(percent),
      [Field.CURRENCY_B]: availableQuote?.multiply(percent),
    };

    formattedAmounts = {
      [Field.CURRENCY_A]: parsedAmount[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]: parsedAmount[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    };
  } else {
    const [independentToken, dependentToken] =
      independentField === Field.CURRENCY_A ? [pair.token0, pair.token1] : [pair.token1, pair.token0];

    const independentAmount = tryParseAmount(typedValue, independentToken);
    const dependentAmountFrac = independentAmount?.multiply(price);

    parsedAmount = {
      [independentField]: independentAmount,
      [dependentField]:
        dependentAmountFrac &&
        CurrencyAmount.fromFractionalAmount(
          dependentToken,
          dependentAmountFrac.numerator,
          dependentAmountFrac.denominator,
        ),
    };

    formattedAmounts = {
      [independentField]: typedValue,
      [dependentField]: parsedAmount[dependentField]?.toFixed(6) ?? '',
    };
  }

  const handleFieldAInput = (value: string) => {
    if (availableBase && availableBase.greaterThan(0)) {
      const valueBN = new BigNumber(value || '0');
      const p = valueBN.isNaN() ? 0 : Math.min(valueBN.div(availableBase.toFixed()).multipliedBy(100).toNumber(), 100);
      setState({ independentField: Field.CURRENCY_A, typedValue: value, inputType: 'text', portion: p });
    }
  };

  const handleFieldBInput = (value: string) => {
    if (availableQuote && availableQuote.greaterThan(0)) {
      const valueBN = new BigNumber(value || '0');
      const p = valueBN.isNaN() ? 0 : Math.min(valueBN.div(availableQuote.toFixed()).multipliedBy(100).toNumber(), 100);
      setState({ independentField: Field.CURRENCY_B, typedValue: value, inputType: 'text', portion: p });
    }
  };

  const handleSlide = (values: string[], handle: number) => {
    setState({
      typedValue,
      independentField,
      inputType: 'slider',
      portion: parseFloat(values[handle]),
    });
  };

  useEffect(() => {
    availableBase &&
      availableQuote &&
      availableBase.greaterThan(0) &&
      availableQuote.greaterThan(0) &&
      onChangeWithdrawnValue(
        poolId,
        new BigNumber(portion),
        availableBase.multiply(percent),
        availableQuote.multiply(percent),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChangeWithdrawnValue, percent, portion, availableBase?.toFixed(), availableQuote?.toFixed(), poolId]);

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(portion);
    }
  }, [sliderInstance, inputType, portion]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const addTransaction = useTransactionAdder();

  const resetValue = () => {
    sliderInstance.current.noUiSlider.set(0);
    setState({ typedValue, independentField, inputType: 'slider', portion: 0 });
  };

  const handleWithdraw = () => {
    if (!account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const numPortion = new BigNumber(portion / 100);

    const t = multiplyCABN(balance.balance, numPortion);

    const aT = multiplyCABN(availableBase, numPortion);
    const bT = multiplyCABN(availableQuote, numPortion);

    bnJs
      .inject({ account })
      .Dex.remove(poolId, toDec(t))
      .then(result => {
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(
              aT.toFixed(2, { groupSeparator: ',' }),
              aT.currency.symbol ?? '',
              bT.toFixed(2, { groupSeparator: ',' }),
              bT.currency.symbol ?? '',
            ).pendingMessage,
            summary: withdrawMessage(
              aT.toFixed(2, { groupSeparator: ',' }),
              aT.currency.symbol ?? '',
              bT.toFixed(2, { groupSeparator: ',' }),
              bT.currency.symbol ?? '',
            ).successMessage,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        changeShouldLedgerSign(false);
        resetValue();
      });
  };

  const handleShowConfirm = () => {
    toggleOpen();
  };

  const hasEnoughICX = useHasEnoughICX();

  const availableCurrency = (stakedValue, suppliedValue) =>
    (!!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue)?.toFixed(2, { groupSeparator: ',' }) ||
    '...';

  const isValid =
    formattedAmounts[Field.CURRENCY_A] &&
    formattedAmounts[Field.CURRENCY_B] &&
    formattedAmounts[Field.CURRENCY_A] !== '0' &&
    formattedAmounts[Field.CURRENCY_B] !== '0';

  return (
    <>
      <Wrapper>
        <Typography variant="h3" mb={3}>
          <Trans>Withdraw:</Trans>&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">{`${aBalance.currency.symbol || '...'} / ${
            bBalance.currency.symbol || '...'
          }`}</Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            currency={aBalance.currency}
            onUserInput={handleFieldAInput}
            bg="bg2"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            currency={bBalance.currency}
            onUserInput={handleFieldBInput}
            bg="bg2"
          />
        </Box>
        <Typography mb={5} textAlign="right">
          {`Available:
            ${availableCurrency(parsedAmount[Field.CURRENCY_A], availableBase)} ${
            balances[0]?.currency.symbol || '...'
          } /
            ${availableCurrency(parsedAmount[Field.CURRENCY_B], availableQuote)} ${
            balances[1]?.currency.symbol || '...'
          }`}
        </Typography>
        <Box mb={5}>
          <Nouislider
            start={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [100],
            }}
            step={0.01}
            onSlide={handleSlide}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
            }}
          />
        </Box>
        <Flex alignItems="center" justifyContent="center">
          <Button onClick={handleShowConfirm} disabled={!isValid}>
            <Trans>Withdraw liquidity</Trans>
          </Button>
        </Flex>
      </Wrapper>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            <Trans>Withdraw liquidity?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {parsedAmount[Field.CURRENCY_A]?.toFixed(2, { groupSeparator: ',' })}{' '}
            {parsedAmount[Field.CURRENCY_A]?.currency.symbol || '...'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {parsedAmount[Field.CURRENCY_B]?.toFixed(2, { groupSeparator: ',' })}{' '}
            {parsedAmount[Field.CURRENCY_B]?.currency.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleWithdraw} disabled={!hasEnoughICX}>
                  <Trans>Withdraw</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};
