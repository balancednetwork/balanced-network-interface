import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { useUserCollectedFeesQuery, useRewardQuery } from 'queries/reward';
import { Flex } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { addressToCurrencyKeyMap } from 'constants/currency';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useHasRewardableLoan, useHasRewardableLiquidity, useHasNetworkFees } from 'store/reward/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';

const RewardsPanel = () => {
  const { account, networkId } = useIconReact();
  const addTransaction = useTransactionAdder();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const [rewardTx, setRewardTx] = React.useState('');
  const handleRewardClaim = () => {
    if (!account) return;

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account: account })
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
  const [feeTx, setFeeTx] = React.useState('');
  const handleFeeClaim = () => {
    if (!account) return;

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account: account })
      .Dividends.claim()
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

  const rewardQuery = useRewardQuery();
  const reward = rewardQuery.data;

  const hasRewardableLoan = useHasRewardableLoan();

  const hasRewardableLiquidity = useHasRewardableLiquidity();

  const hasNetworkFees = useHasNetworkFees();

  const feesQuery = useUserCollectedFeesQuery();
  const fees = feesQuery.data;
  const hasFee = fees && !!Object.values(fees).find(fee => !fee.isZero());

  const rewardTxStatus = useTransactionStatus(rewardTx);
  const feeTxStatus = useTransactionStatus(feeTx);
  React.useEffect(() => {
    if (rewardTxStatus === TransactionStatus.success) rewardQuery.refetch();
    if (feeTxStatus === TransactionStatus.success) feesQuery.refetch();
  }, [rewardTxStatus, feeTxStatus, rewardQuery, feesQuery]);

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
            Claim
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
    <div>
      <BoxPanel bg="bg2">
        <Flex alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h2">Rewards</Typography>
        </Flex>

        <Flex>
          <Flex flex={1} flexDirection="column" alignItems="center" className="border-right">
            <Typography variant="p" mb={2}>
              Balance Tokens
            </Typography>
            {getRewardsUI()}
          </Flex>

          <Flex flex={1} flexDirection="column" alignItems="center">
            <Typography variant="p" mb={2} as="div">
              Network fees
            </Typography>
            {getNetworkFeesUI()}
          </Flex>
        </Flex>
        {/* ledger */}
        <LedgerConfirmMessage mt={5} />
      </BoxPanel>

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
    </div>
  );
};

export default RewardsPanel;
