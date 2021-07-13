import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { addressToCurrencyKeyMap } from 'constants/currency';
import { useUserCollectedFeesQuery, useRewardQuery, BATCH_SIZE, usePlatformDayQuery } from 'queries/reward';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useHasRewardableLoan, useHasRewardableLiquidity, useHasNetworkFees } from 'store/reward/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';

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
      });
  };

  const rewardQuery = useRewardQuery();
  const reward = rewardQuery.data;

  const hasRewardableLoan = useHasRewardableLoan();

  const hasRewardableLiquidity = useHasRewardableLiquidity();
  const [rewardTx, setRewardTx] = React.useState('');
  const rewardTxStatus = useTransactionStatus(rewardTx);
  React.useEffect(() => {
    if (rewardTxStatus === TransactionStatus.success) rewardQuery.refetch();
  }, [rewardTxStatus, rewardQuery]);

  // stake new balance tokens modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const getRewardsUI = () => {
    if (!hasRewardableLoan && !hasRewardableLiquidity && reward?.isZero()) {
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
          <Button mt={2} onClick={handleRewardClaim}>
            Claim
          </Button>
        </>
      );
    }
  };

  return (
    <Flex flex={1} flexDirection="column" alignItems="center" className="border-right">
      <Typography variant="p" mb={2}>
        Balance Tokens
      </Typography>
      {getRewardsUI()}

      {/* Stake new Balance Tokens Modal */}
      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Stake new Balance Tokens
          </Typography>

          <Typography variant="p" textAlign="center" fontSize={19}>
            Stake your new BALN from your wallet to accrue rewards from network fees.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={toggleOpen} fontSize={14}>
              Close
            </Button>
          </Flex>
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

          <Button mt={2} onClick={handleFeeClaim}>
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
    </Flex>
  );
};
