import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
//import ShouldLedgerConfirmMessage from 'app/components/DepositStakeMessage';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useHasRewardableLoan, useHasRewardableLiquidity, useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

const RewardsPanel = () => {
  const { account } = useIconReact();
  const wallet = useWalletBalances();
  const addTransaction = useTransactionAdder();

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

  const ratio = useRatio();

  const rewardAmountByUSD = reward.multipliedBy(ratio.BALNbnUSDratio);

  const hasRewardableLoan = useHasRewardableLoan();

  const hasRewardableLiquidity = useHasRewardableLiquidity();

  const hashNetworkFees = useHasNetworkFees();

  // stake new balance tokens modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  if (!hasRewardableLoan && !hasRewardableLiquidity && reward.isZero()) {
    return (
      <div>
        <FlexPanel bg="bg2" flexDirection="column">
          <Typography variant="h2" mb={5}>
            Rewards
          </Typography>

          <Flex flex={1} justifyContent="center" alignItems="center" minHeight={100}>
            <Typography textAlign="center">
              To earn Balanced rewards, take out a loan <br />
              or supply liquidity on the Trade page.
            </Typography>
          </Flex>
        </FlexPanel>
      </div>
    );
  }

  return (
    <div>
      <BoxPanel bg="bg2">
        <Typography variant="h2" mb={5}>
          Rewards
        </Typography>

        <RewardGrid>
          <Row>
            <Typography variant="p">Balance Tokens</Typography>
            <Typography variant="p">
              {!account ? '-' : reward.isZero() ? 'Pending' : `${reward.dp(2).toFormat()} BALN`}
            </Typography>
          </Row>

          <Row>
            <Typography variant="p">
              Network fees
              <QuestionHelper text="To be eligible for network fees, stake BALN and borrow at least 50 bnUSD, or supply liquidity to the BALN/bnUSD pool." />
            </Typography>
            <Typography variant="p">{!account ? '-' : hashNetworkFees ? 'Eligible' : 'Ineligible'}</Typography>
          </Row>

          {!reward.isZero() && (
            <>
              <Divider />

              <Row>
                <Typography variant="p" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="p" fontWeight="bold">
                  {`$${rewardAmountByUSD.dp(2).toFormat()}`}
                </Typography>
              </Row>
            </>
          )}
        </RewardGrid>

        {!reward.isZero() && (
          <Flex alignItems="center" justifyContent="center" mt={3}>
            <Button onClick={handleClaim}>Claim rewards</Button>
          </Flex>
        )}
      </BoxPanel>

      {/* Stake new Balance Tokens Modal */}
      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Stake new Balance Tokens
          </Typography>

          <Typography variant="p" textAlign="center" fontSize={19} mb={3}>
            Stake your new BALN from your wallet to accrue rewards from network fees*.
          </Typography>

          <Typography textAlign="center">
            *Must borrow at least 50 bnUSD and keep your risk below the reward threshold.
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

const RewardGrid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 20px;
`;

const Row = styled(Flex)`
  align-items: flex-start;
  justify-content: space-between;
`;
