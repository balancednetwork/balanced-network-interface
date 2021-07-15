import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import TransactionPanel from 'app/components/home/TransactionPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { Pagemeta } from 'app/components/Pagemeta';
import { useCollateralFetchInfo } from 'store/collateral/hooks';
import { useLoanFetchInfo } from 'store/loan/hooks';
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

const SignInMessage = styled(Box)`
  width: 100%;
  align-self: stretch;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export function HomePage() {
  const { account } = useIconReact();

  useFetchPrice();
  useWalletFetchBalances(account);
  useCollateralFetchInfo(account);
  useLoanFetchInfo(account);
  useFetchRewardsInfo();

  return (
    <DefaultLayout>
      <Pagemeta
        title="Home"
        description="Deposit ICX as collateral, borrow tokens pegged to real-world assets, and earn rewards for it."
        image={`${window.location.origin}/home.png`}
      />

      {account ? (
        <Grid>
          <CollateralPanel />
          <LoanPanel />
          <PositionDetailPanel />
          <WalletPanel />
          <RewardsPanel />
          <TransactionPanel />
        </Grid>
      ) : (
        <SignInMessage>Sign in to use the Home page.</SignInMessage>
      )}
    </DefaultLayout>
  );
}
