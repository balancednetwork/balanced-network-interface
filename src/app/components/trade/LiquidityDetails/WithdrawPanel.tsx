import React, { useEffect, useMemo } from 'react';

import { Currency, CurrencyAmount, Fraction, Percent } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import CurrencyLogo from 'app/components/CurrencyLogo';
import { EXA, WEIGHT } from 'app/components/home/BBaln/utils';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { BIGINT_ZERO, FRACTION_ONE, FRACTION_ZERO } from 'constants/misc';
import { BalanceData } from 'hooks/useV2Pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Source } from 'store/bbaln/hooks';
import { Field } from 'store/mint/actions';
import { useChangeWithdrawnValue, useStakedLPPercent } from 'store/stakedLP/hooks';
import { tryParseAmount } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useCurrencyBalances, useHasEnoughICX } from 'store/wallet/hooks';
import { multiplyCABN, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { withdrawMessage } from '../utils';

const Wrapper = styled(Flex)`
  padding-left: 0;
  margin-left: 0;
  margin-top: 30px;
  flex-direction: column;
  border-left: none;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding-left: 35px;
    margin-left: 35px;
    padding-top: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    border-top: 0;
    margin-top: 0;
  `}
`;

export function getRate(pair: Pair, balance: BalanceData, stakedRatio = new Fraction(1)): Fraction {
  //When balance = 0, use stakedLPBalance to calculate rate
  if (pair.totalSupply && JSBI.greaterThan(pair.totalSupply.quotient, BIGINT_ZERO) && balance) {
    const amount = (balance?.stakedLPBalance ? balance.balance.add(balance.stakedLPBalance) : balance.balance).divide(
      pair.totalSupply.multiply(stakedRatio),
    );
    return new Fraction(amount.numerator, amount.denominator);
  }
  return FRACTION_ZERO;
}

export function getABBalance(pair: Pair, balance: BalanceData) {
  const rate = getRate(pair, balance);

  return [pair.reserve0.multiply(rate), pair.reserve1.multiply(rate)];
}

export function getShareReward(
  totalReward: BigNumber,
  boostData?: Source,
  userBalances?: BalanceData,
  stakedRatio?: Fraction,
  totalBbalnSupply?: BigNumber,
  userBbalnBalance?: BigNumber,
): BigNumber {
  //handle icx queue
  if (!stakedRatio && boostData) {
    return totalReward.times(boostData.workingBalance.div(boostData.workingSupply));
  }

  //handle standard LPs
  if (boostData && userBalances && stakedRatio && totalBbalnSupply && userBbalnBalance) {
    const stakedFractionNumber = new BigNumber(stakedRatio.toFixed(8)).div(100);
    if (stakedFractionNumber.isEqualTo(0)) {
      return new BigNumber(0);
    }
    const unStakedLPBalance = new BigNumber(userBalances.balance.toExact()).times(
      10 ** userBalances.balance.currency.decimals,
    );
    const max = boostData.balance.times(EXA).div(WEIGHT);
    let boost = new BigNumber(0);
    if (userBbalnBalance.isGreaterThan(0) && boostData.balance.isGreaterThan(0)) {
      boost = boostData.supply.times(userBbalnBalance).times(EXA.minus(WEIGHT)).div(totalBbalnSupply).div(WEIGHT);
    }

    let newBalance = boostData.balance.plus(unStakedLPBalance).times(stakedFractionNumber);
    newBalance = newBalance.plus(boost);
    newBalance = boostData.balance.isGreaterThan(0) ? BigNumber.min(newBalance, max) : newBalance;
    const newWorkingSupply = boostData.workingSupply.minus(boostData.workingBalance).plus(newBalance);
    return totalReward.times(newBalance.div(newWorkingSupply));
  }

  return new BigNumber(0);
}

export const WithdrawPanel = ({ pair, balance, poolId }: { pair: Pair; balance: BalanceData; poolId: number }) => {
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
      sliderInstance.current?.noUiSlider.set(portion);
    }
  }, [sliderInstance, inputType, portion]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const addTransaction = useTransactionAdder();

  const resetValue = () => {
    sliderInstance.current?.noUiSlider.set(0);
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

  const hasUnstakedLP = availableBase?.greaterThan(0) && availableQuote?.greaterThan(0);

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
          {hasUnstakedLP && (
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
          )}
        </Box>
        <Flex alignItems="center" justifyContent="center">
          <Button onClick={handleShowConfirm} disabled={!isValid || !hasUnstakedLP}>
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

export const WithdrawPanelQ = ({
  balance,
  pair,
  totalReward,
  apy,
  source,
}: {
  pair: Pair;
  balance: BalanceData;
  totalReward: BigNumber;
  apy: number | null;
  source?: Source;
}) => {
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const upSmall = useMedia('(min-width: 800px)');

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

  const RespoRewardsInfo = () => {
    const reward = getShareReward(totalReward, source);

    return (
      <Flex
        marginBottom={4}
        justifyContent="space-between"
        paddingBottom={4}
        sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
        width="100%"
      >
        <Box>
          <Typography color="text2">
            <Trans>Daily rewards</Trans>
          </Typography>
          <Typography color="text" fontSize={16}>
            {`~ ${reward.toFormat(2, BigNumber.ROUND_HALF_UP) || '-'} BALN`}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography color="text2">
            <Trans>APY</Trans>
          </Typography>
          <Typography color="text" fontSize={16}>
            {`${
              apy && source
                ? new BigNumber(apy)
                    .times(100)
                    .times(source.workingBalance.div(source.balance) || 1)
                    .toFormat(2)
                : '-'
            }%`}
          </Typography>
        </Box>
      </Flex>
    );
  };

  return (
    <>
      {!upSmall && <RespoRewardsInfo />}
      <Flex flexDirection="column" alignItems="center" margin="0 auto">
        <Typography variant="h3" mb={3}>
          <Trans>Withdraw:</Trans>&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">{`${pair.token0.symbol || '...'} / ${
            pair.token1.symbol || '...'
          }`}</Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="center" flexWrap="wrap">
          <OptionButton
            disabled={JSBI.equal(balance.balance1?.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption2}
            m={1}
          >
            <CurrencyLogo currency={balance.balance1?.currency} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX
            </Typography>
          </OptionButton>

          <OptionButton
            disabled={JSBI.equal(balance.balance.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption1}
            m={1}
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
