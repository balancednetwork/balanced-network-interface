import React from 'react';

import { useIconReact } from 'packages/icon-react';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import CollateralPanel from 'app/pages/home/CollateralPanel';
import LoanPanel from 'app/pages/home/LoanPanel';
import PositionDetailPanel from 'app/pages/home/PositionDetailPanel';
import RewardsPanel from 'app/pages/home/RewardsPanel';
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
    <Grid>
      <CollateralPanel />
      <LoanPanel />
      <PositionDetailPanel />
      <RewardsPanel />
    </Grid>
  );
}
