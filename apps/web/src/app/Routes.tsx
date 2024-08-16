import React, { useEffect } from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { DefaultLayout } from '@/app/components/Layout';

import { lazyLoad } from '@/utils/loadable';

const HomePage = lazyLoad(
  () => import('./pages/page'),
  module => module.HomePage,
);

const TradePageLayout = lazyLoad(
  () => import('./pages/trade/layout'),
  module => module.TradePageLayout,
);
import { LegacyBridge } from './pages/legacy-bridge/page';
import { TestPage } from './pages/test/page';
import { BridgePage } from './pages/trade/bridge/page';
import { SupplyPage } from './pages/trade/supply/page';
import { TradePage } from './pages/trade/xswap/page';

import { useBBalnSliderActionHandlers } from '@/store/bbaln/hooks';
import { useCollateralActionHandlers } from '@/store/collateral/hooks';
import { useLoanActionHandlers } from '@/store/loan/hooks';
import { useSavingsSliderActionHandlers } from '@/store/savings/hooks';

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
  const { onAdjust: loanAdjust } = useLoanActionHandlers();
  const { onAdjust: collateralAdjust } = useCollateralActionHandlers();
  const { onAdjust: bbalnAdjust } = useBBalnSliderActionHandlers();
  const { onAdjust: savingsAdjust } = useSavingsSliderActionHandlers();

  useEffect(() => {
    if (location) {
      loanAdjust(false);
      collateralAdjust(false);
      bbalnAdjust(false);
      savingsAdjust(false);
    }
  }, [location, loanAdjust, collateralAdjust, bbalnAdjust, savingsAdjust]);

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

        <Route path="legacy-bridge" element={<LegacyBridge />} />
        <Route path="airdrip" element={<Redirect to="https://balanced.network/" />} />
        <Route path="*" element={<Redirect to="https://balanced.network/404" />} />
      </Route>

      <Route path="/claim-legacy-fees" element={<ClaimLegacyFeesPage />} />
      <Route path="/claim-goodwill" element={<ClaimGoodwillPage />} />
    </Routes>
  );
}
