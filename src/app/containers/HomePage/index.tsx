import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel, { RewardsPanelLayout } from 'app/components/home/RewardsPanel';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useFetchBBalnInfo, useFetchBBalnSources } from 'store/bbaln/hooks';
import { useCollateralFetchInfo } from 'store/collateral/hooks';
import { useFetchUserVoteData } from 'store/liveVoting/hooks';
import { useLoanFetchInfo } from 'store/loan/hooks';
import { useFetchOraclePrices } from 'store/oracle/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 35px;
  margin-bottom: 35px;

  ${({ theme }) => theme.mediaWidth.upMedium`
    grid-gap: 50px;
    margin-bottom: 50px;
    grid-template-columns: 1fr 1fr;
  `};
`;

export function HomePage() {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();

  useFetchPrice();
  useFetchOraclePrices();
  useFetchBBalnSources();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account, accountArch);
  useCollateralFetchInfo(account);
  useLoanFetchInfo(account);
  useFetchRewardsInfo();
  useFetchUserVoteData();

  return (
    <>
      {account ? (
        <Grid>
          <CollateralPanel />
          <LoanPanel />
          <PositionDetailPanel />
          <RewardsPanel />
        </Grid>
      ) : (
        <Grid>
          <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
            <Typography variant="h2" paddingRight={'7px'}>
              <Trans>Collateral</Trans>
            </Typography>
            <Typography mt={8} mb={7} textAlign="center">
              <Trans>To deposit collateral, sign in on ICON.</Trans>
            </Typography>
          </BoxPanel>
          <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
            <Typography variant="h2" paddingRight={'7px'}>
              <Trans>Loan</Trans>
            </Typography>
            <Typography mt={8} mb={7} textAlign="center">
              <Trans>To take out a loan, deposit collateral.</Trans>
            </Typography>
          </BoxPanel>
          <RewardsPanelLayout bg="bg2" className="js-rewards-panel" mb={'100px'}>
            <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 'initial', 350]}>
              <Flex alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h2">
                  <Trans>Rewards</Trans>
                </Typography>
              </Flex>

              <Typography mt={5} mb={3} textAlign="center">
                <Trans>To earn Balanced rewards, take out a loan, supply liquidity, or lock up BALN.</Trans>
              </Typography>

              <Flex></Flex>
            </BoxPanel>

            <BoxPanel bg="bg2" flex={1}>
              <Typography variant="h3">
                <Trans>Boost rewards</Trans>
              </Typography>

              <Typography mt={6} mb={3}>
                <Trans>Earn or buy BALN, then lock it up here to boost your earning potential and voting power.</Trans>
              </Typography>
            </BoxPanel>
          </RewardsPanelLayout>
        </Grid>
      )}
    </>
  );
}
