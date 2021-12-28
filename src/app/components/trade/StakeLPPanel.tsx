import React, { useEffect, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from 'constants/index';
import { SUPPORTED_PAIRS } from 'constants/pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBalance } from 'store/pool/hooks';
import { useChangeStakedLPPercent, useStakedLPPercent, useTotalStaked } from 'store/stakedLP/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

export default React.memo(function StakeLPPanel({ poolId }: { poolId: number }) {
  const { account } = useIconReact();

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const balance = useBalance(poolId);
  const stakedBalance = useMemo(
    () => new BigNumber(balance?.stakedLPBalance?.toFixed() || 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balance?.stakedLPBalance],
  );

  const totalStaked = useTotalStaked(poolId);

  const onStakedLPPercentSelected = useChangeStakedLPPercent();
  const stakedPercent = useStakedLPPercent(poolId);

  const [isAdjusting, setAdjusting] = React.useState(false);
  const handleAdjust = () => {
    setAdjusting(true);
  };
  const handleCancel = () => {
    setAdjusting(false);
  };

  useEffect(() => {
    onStakedLPPercentSelected(
      poolId,
      totalStaked.isZero() ? ZERO : stakedBalance.dividedBy(totalStaked).multipliedBy(100),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onStakedLPPercentSelected, poolId, stakedBalance, totalStaked]);

  const handleSlide = useCallback(
    (values: string[], handle: number) => {
      onStakedLPPercentSelected(poolId, new BigNumber(values[handle]));
    },
    [onStakedLPPercentSelected, poolId],
  );

  useEffect(() => {
    if (!isAdjusting) {
      onStakedLPPercentSelected(
        poolId,
        !totalStaked.isZero() ? stakedBalance.dividedBy(totalStaked).multipliedBy(100) : ZERO,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onStakedLPPercentSelected, isAdjusting, totalStaked, poolId, stakedBalance]);

  // modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const beforeAmount = stakedBalance;
  const afterAmount = stakedPercent.multipliedBy(totalStaked).div(100);
  const differenceAmount = afterAmount.minus(beforeAmount?.toFixed() || ZERO);
  const shouldStake = differenceAmount.isPositive();

  const addTransaction = useTransactionAdder();

  const handleConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    if (shouldStake) {
      bnJs
        .inject({ account: account })
        .Dex.stake(poolId, BalancedJs.utils.toLoop(differenceAmount.abs()))
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Staking LP tokens...',
                summary: `Staked ${differenceAmount.abs().dp(2).toFormat()} LP tokens.`,
              },
            );

            toggleOpen();
            handleCancel();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    } else {
      bnJs
        .inject({ account: account })
        .StakedLP.unstake(poolId, BalancedJs.utils.toLoop(differenceAmount.abs()))
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Unstaking LP tokens...',
                summary: `Unstaked ${differenceAmount.abs().dp(2).toFormat()} LP tokens.`,
              },
            );

            toggleOpen();
            handleCancel();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    }
  };

  const description = shouldStake ? "You'll earn BALN until you unstake them." : "You'll stop earning BALN from them.";

  const hasEnoughICX = useHasEnoughICX();

  const hasReward = !!SUPPORTED_PAIRS.find(pair => pair.id === poolId)?.rewards?.toString();

  const upSmall = useMedia('(min-width: 800px)');

  return (
    <Box width={upSmall ? 1 / 2 : 1}>
      <Typography variant="h3" marginBottom="15px">
        Stake LP tokens
      </Typography>
      {hasReward ? (
        <>
          <Typography my={1}>Stake your LP tokens to earn BALN from this liquidity pool.</Typography>

          <Box my={3}>
            <Nouislider
              disabled={!isAdjusting}
              id="slider-collateral"
              start={[stakedBalance.dividedBy(totalStaked).multipliedBy(100).dp(2).toNumber()]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [totalStaked.dp(2).isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : 100],
              }}
              onSlide={handleSlide}
            />
          </Box>

          <Flex my={1} alignItems="center" justifyContent="space-between">
            <Typography>
              {stakedPercent.multipliedBy(totalStaked).div(100).dp(2).toFormat()} / {totalStaked.dp(2).toFormat()} LP
              tokens
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={5}>
            {!isAdjusting ? (
              <Button onClick={handleAdjust}>Adjust stake</Button>
            ) : (
              <>
                <TextButton onClick={handleCancel}>Cancel</TextButton>
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            )}
          </Flex>

          <Modal isOpen={open} onDismiss={toggleOpen}>
            <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
              <Typography textAlign="center" mb="5px">
                {shouldStake ? 'Stake LP tokens?' : 'Unstake LP tokens?'}
              </Typography>

              <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
                {differenceAmount.abs().dp(2).toFormat()}
              </Typography>

              <Flex my={5}>
                <Box width={1 / 2} className="border-right">
                  <Typography textAlign="center">Before</Typography>
                  <Typography variant="p" textAlign="center">
                    {beforeAmount.dp(2).toFormat()}
                  </Typography>
                </Box>

                <Box width={1 / 2}>
                  <Typography textAlign="center">After</Typography>
                  <Typography variant="p" textAlign="center">
                    {afterAmount.dp(2).toFormat()}
                  </Typography>
                </Box>
              </Flex>

              <Typography textAlign="center">{description}</Typography>

              <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                {shouldLedgerSign && <Spinner></Spinner>}
                {!shouldLedgerSign && (
                  <>
                    <TextButton onClick={toggleOpen} fontSize={14}>
                      Cancel
                    </TextButton>
                    <Button onClick={handleConfirm} fontSize={14} disabled={!hasEnoughICX}>
                      {shouldStake ? 'Stake' : 'Unstake'}
                    </Button>
                  </>
                )}
              </Flex>

              <LedgerConfirmMessage />

              {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
            </Flex>
          </Modal>
        </>
      ) : (
        <Typography my={1}>
          You have
          <Typography as="span" fontWeight="bold" color="white">
            {` ${totalStaked.dp(2).toFormat()} LP tokens`}
          </Typography>
          . You may be able to stake them on another platform to earn more rewards.
        </Typography>
      )}
    </Box>
  );
});
