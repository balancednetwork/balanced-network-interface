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
import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import bnJs from '@/bnJs';
import { BIGINT_ZERO, FRACTION_ONE, FRACTION_ZERO } from '@/constants/misc';
import { BalanceData } from '@/hooks/useV2Pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from '@/store/application/hooks';
import { Source } from '@/store/bbaln/hooks';
import { Field } from '@/store/mint/reducer';
import { tryParseAmount } from '@/store/swap/hooks';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useCurrencyBalances, useHasEnoughICX } from '@/store/wallet/hooks';
import { formatBigNumber, multiplyCABN, toDec } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import { EXA, WEIGHT } from '@/app/components/home/BBaln/utils';
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
  return <></>;
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

  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    transition: border 0.2s ease;
  }

  > svg,
  img {
    margin-bottom: 10px;
  }
`;
