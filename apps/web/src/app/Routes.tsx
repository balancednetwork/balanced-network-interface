import React, { useEffect } from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';

import { DefaultLayout } from 'app/components/Layout';

import { lazyLoad } from 'utils/loadable';

// import { HomePage } from './containers/HomePage/Loadable';
const HomePage = lazyLoad(
  () => import('./pages/page'),
  module => module.HomePage,
);

// import { TradePage } from './containers/TradePage/Loadable';
const TradePageLayout = lazyLoad(
  () => import('./pages/trade/layout'),
  module => module.TradePageLayout,
);

import { TradePage } from './pages/trade/page';
import { SupplyPage } from './pages/trade/supply/page';
import { BridgePage } from './pages/trade/bridge/page';
// const TradePage = lazyLoad(
//   () => import('./pages/trade/page'),
//   module => module.TradePage,
// );
// const SupplyPage = lazyLoad(
//   () => import('./pages/trade/supply/page'),
//   module => module.SupplyPage,
// );
// const BridgePage = lazyLoad(
//   () => import('./pages/trade/bridge/page'),
//   module => module.BridgePage,
// );

// import { VotePage } from './pages/vote/page';
const VotePage = lazyLoad(
  () => import('./pages/vote/page'),
  module => module.VotePage,
);

import { ProposalListPage } from './pages/vote/proposals/page';
// import { ProposalPage } from './containers/ProposalPage/Loadable';
const ProposalDetailsPage = lazyLoad(
  () => import('./pages/vote/proposals/[proposalId]/page'),
  module => module.ProposalDetailsPage,
);
// import { NewProposalPage } from './containers/NewProposalPage/Loadable';
const ProposalNewPage = lazyLoad(
  () => import('./pages/vote/proposals/new/page'),
  module => module.ProposalNewPage,
);

// import { ClaimGoodwill } from './containers/Claim/Goodwill';
// import { Claim } from './containers/Claim/LegacyFees';
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

        <Route path="airdrip" element={<Redirect to="https://balanced.network/" />} />
        <Route path="*" element={<Redirect to="https://balanced.network/404" />} />
      </Route>

      <Route path="/claim-legacy-fees" element={<ClaimLegacyFeesPage />} />
      <Route path="/claim-goodwill" element={<ClaimGoodwillPage />} />
    </Routes>
  );
}
