import React from 'react';

import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

import { DefaultLayout } from 'app/components/Layout';
import { Panel } from 'app/components/Panel';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

const ActivityPanel = styled(Panel)`
  grid-area: '3 / 1 / 3 / 3';
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
  `}
`;

export function HomePage() {
  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      <Grid>
        <Panel bg="bg3">Collateral</Panel>
        <Panel bg="bg3">Loan</Panel>
        <Panel bg="bg3">Wallet</Panel>
        <Panel bg="bg3">Rewards</Panel>

        <ActivityPanel bg="bg3">Activity</ActivityPanel>
      </Grid>
    </DefaultLayout>
  );
}
