import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import TransactionPanel from 'app/components/home/TransactionPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { Link } from 'app/components/Link';
import { Typography } from 'app/theme';
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
    <DefaultLayout
      banners={[
        <>
          <Typography as="span">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur a tellus viverra, maximus nibh et,
            scelerisque ligula. Cras venenatis lorem odio, non luctus metus convallis ornare. Donec metus massa,
            porttitor vel magna et, faucibus eleifend magna. {''}
          </Typography>
          <Link href="#" noBorder>
            Learn more about these changes.
          </Link>
        </>,
        <>
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur a tellus viverra, maximus nibh et,
            scelerisque ligula. Cras venenatis lorem odio, non luctus metus convallis ornare. Donec metus massa,
            porttitor vel magna et, faucibus eleifend magna.
          </Typography>
        </>,
      ]}
    >
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
          <TransactionPanel />
        </Grid>
      ) : (
        <SignInMessage>Sign in to use the Home page.</SignInMessage>
      )}
    </DefaultLayout>
  );
}
