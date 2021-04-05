import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { useFetchCollateralInfo } from 'store/collateral/hooks';
import { useLoanFetchInfo } from 'store/loan/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchBalance } from 'store/wallet/hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
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
  useFetchBalance(account);
  useFetchCollateralInfo(account);
  useLoanFetchInfo(account);

  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      {account ? (
        <Grid>
          <CollateralPanel />
          <LoanPanel />
          <PositionDetailPanel />
          <WalletPanel />
          <RewardsPanel />
        </Grid>
      ) : (
        <SignInMessage>Sign in to use the Home page.</SignInMessage>
      )}
    </DefaultLayout>
  );
}
