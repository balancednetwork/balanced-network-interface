import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign /*useShouldLedgerSign*/ } from 'store/application/hooks';
import { useHasRewardableLoan, useHasRewardableLiquidity, useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

import DividendVote from './DividendVote';

const RewardsPanel = () => {
  const { account } = useIconReact();
  const wallet = useWalletBalances();
  const addTransaction = useTransactionAdder();

  // const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleClaim = () => {
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
            summary: `Claimed ${reward.dp(2).toFormat()} BALN.`,
            pending: 'Claiming rewards...',
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
      });
  };

  const reward = wallet.BALNreward;

  const hasRewardableLoan = useHasRewardableLoan();

  const hasRewardableLiquidity = useHasRewardableLiquidity();

  const hasNetworkFees = useHasNetworkFees();

  // stake new balance tokens modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const getRewardsUI = () => {
    if (!hasRewardableLoan && !hasRewardableLiquidity) {
      return (
        <>
          <Typography variant="p" as="div">
            Ineligible
            <QuestionHelper text="To earn Balanced rewards, take out a loan or supply liquidity on the Trade page." />
          </Typography>
        </>
      );
    } else if (reward.isZero()) {
      return <Typography variant="p">Pending</Typography>;
    } else {
      return (
        <>
          <Typography variant="p" mb={2}>{`${reward.dp(2).toFormat()} BALN`}</Typography>
          <Button onClick={handleClaim}>Claim</Button>
        </>
      );
    }
  };

  const getNetworkFeesUI = () => {
    if (hasNetworkFees) {
      return <Typography variant="p">Eligible</Typography>;
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

          <DividendVote />
        </Flex>

        <Flex>
          <Flex flex={1} flexDirection="column" alignItems="center" className="border-right">
            <Typography variant="p" mb={1}>
              Balance Tokens
            </Typography>
            {getRewardsUI()}
          </Flex>

          <Flex flex={1} flexDirection="column" alignItems="center">
            <Typography variant="p" mb={1} as="div">
              Network fees
            </Typography>
            {getNetworkFeesUI()}
          </Flex>
        </Flex>
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
