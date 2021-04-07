import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useRatioValue } from 'store/ratio/hooks';
import { useHasRewardableCollateral, useHasRewardableLiquidity, useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

const RewardsPanel = () => {
  const { account } = useIconReact();
  const wallet = useWalletBalanceValue();
  const addTransaction = useTransactionAdder();

  const handleClaim = () => {
    if (account) {
      bnJs
        .eject({ account: account })
        .Rewards.claimRewards()
        .then(res => {
          addTransaction(
            { hash: res.result }, //
            {
              summary: `Claimed ${reward.dp(2).toFormat()} BALN.`,
            },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  const reward = wallet.BALNreward;

  const ratio = useRatioValue();

  const rewardAmountByUSD = reward.multipliedBy(ratio.BALNbnUSDratio);

  const hasRewardableCollateral = useHasRewardableCollateral();

  const hasRewardableLiquidity = useHasRewardableLiquidity();

  const hashNetworkFees = useHasNetworkFees();

  if (!hasRewardableCollateral && !hasRewardableLiquidity) {
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
            <Typography variant="p">Network fees</Typography>
            <Typography variant="p">{!account ? '-' : hashNetworkFees ? 'Eligible' : 'Ineligible'}</Typography>
          </Row>

          <Divider />

          <Row>
            <Typography variant="p" fontWeight="bold">
              Total
            </Typography>
            <Typography variant="p" fontWeight="bold">
              {`$${rewardAmountByUSD.dp(2).toFormat()}`}
            </Typography>
          </Row>
        </RewardGrid>

        <Flex alignItems="center" justifyContent="center" mt={3}>
          <Button onClick={handleClaim} disabled={reward.isZero()}>
            Claim rewards
          </Button>
        </Flex>
      </BoxPanel>

      {/* Stake new Balance Tokens Modal */}
      {/* <Modal isOpen={open} onDismiss={handleClose}>
          <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
            <Typography textAlign="center" mb="5px">
              Stake new Balance Tokens?
            </Typography>

            <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
              8 BALN
            </Typography>

            <Flex my={5}>
              <Box width={1 / 2} className="border-right">
                <Typography textAlign="center">Before</Typography>
                <Typography variant="p" textAlign="center">
                  50 BALN
                </Typography>
              </Box>

              <Box width={1 / 2}>
                <Typography textAlign="center">After</Typography>
                <Typography variant="p" textAlign="center">
                  58 BALN
                </Typography>
              </Box>
            </Flex>

            <Typography textAlign="center">
              Stake your Balance Tokens to earn dividends.
              <br /> Unstaking takes 3 days.
            </Typography>

            <Flex justifyContent="center" mt={4} pt={4} className="border-top">
              <TextButton onClick={handleClose} fontSize={14}>
                Not now
              </TextButton>
              <Button fontSize={14} onClick={handleClaimReward}>
                Stake
              </Button>
            </Flex>
          </Flex>
        </Modal> */}
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
