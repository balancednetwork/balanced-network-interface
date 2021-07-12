import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { addressToCurrencyKeyMap } from 'constants/currency';
import { ZERO } from 'constants/index';
import { useUserCollectedFeesQuery, useRewardQuery, BATCH_SIZE, usePlatformDayQuery } from 'queries/reward';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useHasNetworkFees, useHasRewardable } from 'store/reward/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';

const RewardsPanel = () => {
  return (
    <div>
      <BoxPanel bg="bg2">
        <Flex alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h2">Rewards</Typography>
        </Flex>

        <Flex>
          <RewardSection />
          <NetworkFeeSection />
        </Flex>

        <LedgerConfirmMessage mt={5} />
      </BoxPanel>
    </div>
  );
};

export default RewardsPanel;

const RewardSection = () => {
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleRewardClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Rewards.claimRewards()
      .then(res => {
        addTransaction(
          { hash: res.result }, //
          {
            summary: `Claimed ${reward?.dp(2).toFormat()} BALN.`,
            pending: 'Claiming rewards...',
          },
        );
        setRewardTx(res.result);
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const rewardQuery = useRewardQuery();
  const reward = rewardQuery.data;

  const hasRewardable = useHasRewardable();

  const [rewardTx, setRewardTx] = React.useState('');
  const rewardTxStatus = useTransactionStatus(rewardTx);
  React.useEffect(() => {
    if (rewardTxStatus === TransactionStatus.success) rewardQuery.refetch();
  }, [rewardTxStatus, rewardQuery]);

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const getRewardsUI = () => {
    if (!hasRewardable && reward?.isZero()) {
      return (
        <>
          <Typography variant="p" as="div">
            Ineligible
            <QuestionHelper text="To earn Balanced rewards, take out a loan or supply liquidity on the Trade page." />
          </Typography>
        </>
      );
    } else if (reward?.isZero()) {
      return (
        <>
          <Typography variant="p" as="div">
            Pending
            <QuestionHelper text="To earn Balanced rewards, take out a loan or supply liquidity on the Trade page." />
          </Typography>
        </>
      );
    } else {
      return (
        <>
          <Typography variant="p">
            {`${reward?.dp(2).toFormat()} `}
            <Typography as="span" color="text1">
              BALN
            </Typography>
          </Typography>
          <Button mt={2} onClick={toggleOpen}>
            Claim
          </Button>
        </>
      );
    }
  };

  const hasEnoughICX = useHasEnoughICX();

  const balances = useWalletBalances();

  const beforeAmount = balances['BALN'].plus(balances['BALNstaked']);

  const afterAmount = beforeAmount.plus(reward || ZERO);

  return (
    <Flex flex={1} flexDirection="column" alignItems="center" className="border-right">
      <Typography variant="p" mb={2}>
        Balance Tokens
      </Typography>
      {reward && getRewardsUI()}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Claim Balance Tokens?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {reward?.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            To earn network fees, stake BALN from your wallet and/or supply it to a liquidity pool.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Not now
            </TextButton>
            <Button onClick={handleRewardClaim} fontSize={14} disabled={!hasEnoughICX}>
              Claim
            </Button>
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </Flex>
  );
};

const NetworkFeeSection = () => {
  const { account, networkId } = useIconReact();
  const [feeTx, setFeeTx] = React.useState('');
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const handleFeeClaim = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const start = feesIndex * BATCH_SIZE + 1;
    const end = start + BATCH_SIZE - 1 < platformDay ? start + BATCH_SIZE - 1 : 0;

    bnJs
      .inject({ account })
      .Dividends.claim(start, end)
      .then(res => {
        addTransaction(
          { hash: res.result }, //
          {
            summary: `Claimed fees.`,
            pending: 'Claiming fees...',
          },
        );
        setFeeTx(res.result);
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
      });
  };

  const feeTxStatus = useTransactionStatus(feeTx);
  React.useEffect(() => {
    if (feeTxStatus === TransactionStatus.success) feesQuery.refetch();
  });

  const hasNetworkFees = useHasNetworkFees();
  const { data: platformDay = 0 } = usePlatformDayQuery();
  const feesQuery = useUserCollectedFeesQuery(1, platformDay);
  const feesArr = feesQuery.data;
  const fees = feesArr?.find(fees => fees);
  const feesIndex = feesArr?.findIndex(fees => fees) || 0;
  const hasFee = !!fees;
  const count = feesArr?.reduce((c, v) => (v ? ++c : c), 0);

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const hasEnoughICX = useHasEnoughICX();

  const getNetworkFeesUI = () => {
    if (hasNetworkFees && !hasFee) {
      return (
        <Typography variant="p" as="div">
          Pending
          <QuestionHelper text="To be eligible for network fees, stake BALN and/or supply BALN to a liquidity pool." />
        </Typography>
      );
    } else if (hasFee) {
      return (
        <>
          {fees &&
            Object.keys(fees)
              .filter(key => !fees[key].isZero())
              .map(key => (
                <Typography key={key} variant="p">
                  {`${fees[key].dp(2).toFormat()}`}{' '}
                  <Typography key={key} as="span" color="text1">
                    {addressToCurrencyKeyMap[networkId][key]}
                  </Typography>
                </Typography>
              ))}

          <Button mt={2} onClick={toggleOpen}>
            {count && count > 1 ? `Claim (1 of ${count})` : 'Claim'}
          </Button>
        </>
      );
    } else {
      return (
        <Typography variant="p" as="div">
          Ineligible
          <QuestionHelper text="To be eligible for network fees, stake BALN and/or supply BALN to a liquidity pool." />
        </Typography>
      );
    }
  };

  return (
    <Flex flex={1} flexDirection="column" alignItems="center">
      <Typography variant="p" mb={2} as="div">
        Network fees
      </Typography>
      {getNetworkFeesUI()}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Claim network fees?
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {fees &&
              Object.keys(fees)
                .filter(key => !fees[key].isZero())
                .map(key => (
                  <Typography key={key} variant="p">
                    {`${fees[key].dp(2).toFormat()}`}{' '}
                    <Typography key={key} as="span" color="text1">
                      {addressToCurrencyKeyMap[networkId][key]}
                    </Typography>
                  </Typography>
                ))}
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Not now
            </TextButton>
            <Button onClick={handleFeeClaim} fontSize={14} disabled={!hasEnoughICX}>
              Claim
            </Button>
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </Flex>
  );
};
