import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useFetchBBalnInfo, useFetchBBalnSources } from 'store/bbaln/hooks';
import { useCollateralFetchInfo } from 'store/collateral/hooks';
import { useFetchUserVoteData } from 'store/liveVoting/hooks';
import { useLoanFetchInfo } from 'store/loan/hooks';
import { useFetchOraclePrices } from 'store/oracle/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useFetchSavingsInfo } from 'store/savings/hooks';
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
  useFetchSavingsInfo(account);
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
              <Trans>To borrow bnUSD, deposit collateral.</Trans>
            </Typography>
          </BoxPanel>
          <RewardsPanel />
        </Grid>
      )}
    </>
  );
}
