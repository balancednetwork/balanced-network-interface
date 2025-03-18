import React, { useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import Nouislider from '@/packages/nouislider-react';
import { Currency, CurrencyAmount, Fraction, Percent } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from '@/app/components/Button';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import CurrencyLogo from '@/app/components/CurrencyLogo';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { BIGINT_ZERO, FRACTION_ONE, FRACTION_ZERO } from '@/constants/misc';
import { BalanceData, Pool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { Source } from '@/store/bbaln/hooks';
import { Field } from '@/store/mint/reducer';
import { useChangeWithdrawnValue, useStakedLPPercent } from '@/store/stakedLP/hooks';
import { tryParseAmount } from '@/store/swap/hooks';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { formatBigNumber } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { bnJs } from '@balancednetwork/xwagmi';

import { EXA, WEIGHT } from '@/app/components/home/BBaln/utils';
import { formatSymbol } from '@/utils/formatter';
import WithdrawLiquidityModal from './WithdrawLiquidityModal';

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
  if (pair.totalSupply && pair.totalSupply.quotient > BIGINT_ZERO && balance) {
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

export function getExternalShareReward(
  totalReward: CurrencyAmount<Currency>,
  userBalances?: BalanceData,
  stakedRatio?: Fraction,
  totalPoolStakedBalance?: BigNumber,
): CurrencyAmount<Currency> {
  if (!userBalances || !stakedRatio || !totalPoolStakedBalance) {
    return CurrencyAmount.fromRawAmount(totalReward.currency, 0);
  }

  const stakedFractionNumber = new BigNumber(stakedRatio.toFixed(8)).div(100);
  if (stakedFractionNumber.isEqualTo(0)) {
    return CurrencyAmount.fromRawAmount(totalReward.currency, 0);
  }

  // Calculate user's share based on their balance and staked ratio
  const totalUserBalance = new BigNumber(userBalances.balance.toExact() || 0)
    .plus(new BigNumber(userBalances.stakedLPBalance?.toExact() || 0))
    .times(10 ** userBalances.balance.currency.decimals);

  const userDynamicStakedLP = totalUserBalance.times(stakedFractionNumber);

  const userShare = userDynamicStakedLP.div(
    totalPoolStakedBalance.plus(new BigNumber(userBalances.balance.toExact() || 0)),
  );

  const rewardAmount = userShare.times(new BigNumber(totalReward.toFixed()));

  return CurrencyAmount.fromRawAmount(
    totalReward.currency,
    new BigNumber(rewardAmount.times(10 ** totalReward.currency.decimals)).toFixed(0),
  );
}

export const WithdrawPanel = ({ pool }: { pool: Pool }) => {
  const { pair, poolId } = pool;
  const onChangeWithdrawnValue = useChangeWithdrawnValue();

  const [executionWithdrawPortion, setExecutionWithdrawPortion] = React.useState<number>(0);
  const [executionParsedAmounts, setExecutionParsedAmounts] = React.useState<{
    [field in Field]?: CurrencyAmount<Currency>;
  }>({});

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

  let parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }, formattedAmounts;

  const percent = useMemo(() => new Percent(Math.floor(portion * 100), 10_000), [portion]);
  const stakedLPPercent = useStakedLPPercent(poolId);
  const [aBalance, bBalance] = usePoolTokenAmounts(pool);
  const availablePercent = new BigNumber(100).minus(stakedLPPercent).abs();
  const availableBase = aBalance.multiply(availablePercent.toFixed(0)).divide(100);
  const availableQuote = bBalance.multiply(availablePercent.toFixed(0)).divide(100);

  if (inputType === 'slider') {
    parsedAmounts = {
      [Field.CURRENCY_A]: availableBase?.multiply(percent),
      [Field.CURRENCY_B]: availableQuote?.multiply(percent),
    };

    formattedAmounts = {
      [Field.CURRENCY_A]: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    };
  } else {
    const [independentToken, dependentToken] =
      independentField === Field.CURRENCY_A ? [pair.token0, pair.token1] : [pair.token1, pair.token0];

    const independentAmount = tryParseAmount(typedValue, independentToken);
    const dependentAmountFrac = independentAmount?.multiply(price);

    parsedAmounts = {
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
      [dependentField]: parsedAmounts[dependentField]?.toFixed(6) ?? '',
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
  }, [onChangeWithdrawnValue, percent, portion, availableBase?.toFixed(), availableQuote?.toFixed(), poolId]);

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(portion);
    }
  }, [inputType, portion]);

  const [open, setOpen] = React.useState(false);

  const handleShowConfirm = () => {
    setExecutionParsedAmounts(parsedAmounts);
    setExecutionWithdrawPortion(portion);
    setOpen(true);
  };

  const isValid =
    formattedAmounts[Field.CURRENCY_A] &&
    formattedAmounts[Field.CURRENCY_B] &&
    formattedAmounts[Field.CURRENCY_A] !== '0' &&
    formattedAmounts[Field.CURRENCY_B] !== '0';

  const hasUnstakedLP = availableBase?.greaterThan(0) && availableQuote?.greaterThan(0);

  const resetValue = () => {
    sliderInstance.current?.noUiSlider.set(0);
    setState({ typedValue, independentField, inputType: 'slider', portion: 0 });
    // availableBase &&
    //   availableQuote &&
    //   availableBase.greaterThan(0) &&
    //   availableQuote.greaterThan(0) &&
    //   onChangeWithdrawnValue(poolId, new BigNumber(0), availableBase.multiply(0), availableQuote.multiply(0));
  };

  return (
    <>
      <Wrapper>
        <Typography variant="h3" mb={3}>
          <Trans>Withdraw:</Trans>&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">{`${
            formatSymbol(aBalance.currency.symbol) || '...'
          } / ${formatSymbol(bBalance.currency.symbol) || '...'}`}</Typography>
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
          ${formatBigNumber(
            new BigNumber(
              parsedAmounts[Field.CURRENCY_A]
                ? (availableBase as CurrencyAmount<Currency>)?.subtract(parsedAmounts[Field.CURRENCY_A]).toFixed()
                : availableBase?.toFixed() || 0,
            ),
            'currency',
          )} ${formatSymbol(pair.token0.symbol) || '...'} /
          ${formatBigNumber(
            new BigNumber(
              parsedAmounts[Field.CURRENCY_B]
                ? (availableQuote as CurrencyAmount<Currency>)?.subtract(parsedAmounts[Field.CURRENCY_B]).toFixed()
                : availableQuote?.toFixed() || 0,
            ),
            'currency',
          )} ${formatSymbol(pair.token1.symbol) || '...'}`}
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

      <WithdrawLiquidityModal
        isOpen={open}
        onClose={() => setOpen(false)}
        parsedAmounts={executionParsedAmounts}
        pool={pool}
        withdrawPortion={executionWithdrawPortion}
        onSuccess={resetValue}
      />
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

  const handleCancelOrder = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

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
      });
  };

  const handleWithdrawEarnings = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

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
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const [open1, setOpen1] = React.useState(false);
  const toggleOpen1 = () => {
    setOpen1(!open1);
  };
  const handleOption1 = () => {
    toggleOpen1();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
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
            disabled={(balance.balance1?.quotient || BIGINT_ZERO) === BIGINT_ZERO}
            onClick={handleOption2}
            m={1}
          >
            <CurrencyLogo currency={balance.balance1?.currency} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX
            </Typography>
          </OptionButton>

          <OptionButton
            disabled={(balance.balance.quotient || BIGINT_ZERO) === BIGINT_ZERO}
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
            <TextButton onClick={toggleOpen1}>Cancel</TextButton>
            <Button onClick={handleCancelOrder} disabled={!hasEnoughICX}>
              <Trans>Withdraw</Trans>
            </Button>
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
            <TextButton onClick={toggleOpen2}>
              <Trans>Cancel</Trans>
            </TextButton>
            <Button onClick={handleWithdrawEarnings} disabled={!hasEnoughICX}>
              <Trans>Withdraw</Trans>
            </Button>
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

  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    transition: border 0.2s ease;
  }

  > svg,
  img {
    margin-bottom: 10px;
  }
`;
