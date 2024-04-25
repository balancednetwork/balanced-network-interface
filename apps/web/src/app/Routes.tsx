import React, { useEffect } from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';

import { DefaultLayout } from 'app/components/Layout';

import { lazyLoad } from 'utils/loadable';

const HomePage = lazyLoad(
  () => import('./pages/page'),
  module => module.HomePage,
);

const TradePageLayout = lazyLoad(
  () => import('./pages/trade/layout'),
  module => module.TradePageLayout,
);
import { TradePage } from './pages/trade/page';
import { SupplyPage } from './pages/trade/supply/page';
import { BridgePage } from './pages/trade/bridge/page';
import { LegacyBridge } from './pages/legacy-bridge/page';

const VotePage = lazyLoad(
  () => import('./pages/vote/page'),
  module => module.VotePage,
);
import { ProposalListPage } from './pages/vote/proposals/page';
const ProposalDetailsPage = lazyLoad(
  () => import('./pages/vote/proposals/[proposalId]/page'),
  module => module.ProposalDetailsPage,
);
const ProposalNewPage = lazyLoad(
  () => import('./pages/vote/proposals/new/page'),
  module => module.ProposalNewPage,
);

const ClaimLegacyFeesPage = lazyLoad(
  () => import('./pages/claim-legacy-fees/page'),
  module => module.ClaimLegacyFeesPage,
);
const ClaimGoodwillPage = lazyLoad(
  () => import('./pages/claim-goodwill/page'),
  module => module.ClaimGoodwillPage,
);

const routeTexts: [string, MessageDescriptor][] = [
  ['/vote', defineMessage({ message: 'Vote' })],
  ['/trade', defineMessage({ message: 'Trade' })],
  ['/legacy-bridge', defineMessage({ message: 'Legacy bridge' })],
  ['/', defineMessage({ message: 'Home' })],
];

const Redirect = ({ to }) => {
  useEffect(() => {
    window.location.href = to;
    throw new Error('Redirecting...');
  }, [to]);
  return null;
};

export default function RootRoutes() {
  const location = useLocation();
  const title = routeTexts.find(item => location.pathname.startsWith(item[0]))?.[1];

  return (
    <Routes>
      <Route
        path="*"
        element={
          <>
            <DefaultLayout title={title?.id}>
              <Helmet>
                <title>{title?.message}</title>
              </Helmet>
              <Outlet />
            </DefaultLayout>
          </>
        }
      >
        <Route index element={<HomePage />} />

        <Route path="trade" element={<TradePageLayout />}>
          <Route index element={<TradePage />} />
          <Route path=":pair" element={<TradePage />} />
          <Route path="supply" element={<SupplyPage />} />
          <Route path="supply/:pair" element={<SupplyPage />} />
          <Route path="bridge/" element={<BridgePage />} />
        </Route>

        <Route path="vote" element={<Outlet />}>
          <Route index element={<VotePage />} />
          <Route path="proposal-list" element={<ProposalListPage />} />
          <Route path="new-proposal" element={<ProposalNewPage />} />
          <Route path="proposal/:id" element={<ProposalDetailsPage />} />
        </Route>

        <Route path="legacy-bridge" element={<LegacyBridge />} />
        <Route path="airdrip" element={<Redirect to="https://balanced.network/" />} />
        <Route path="*" element={<Redirect to="https://balanced.network/404" />} />
      </Route>

      <Route path="/claim-legacy-fees" element={<ClaimLegacyFeesPage />} />
      <Route path="/claim-goodwill" element={<ClaimGoodwillPage />} />
    </Routes>
  );
}
