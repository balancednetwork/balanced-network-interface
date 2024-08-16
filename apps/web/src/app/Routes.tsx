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
import { BridgePage } from './pages/trade/bridge/page';
import { TradePage } from './pages/trade/xswap/page';

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
          <Route path="bridge/" element={<BridgePage />} />
        </Route>

        <Route path="*" element={<Redirect to="https://balanced.network/404" />} />
      </Route>
    </Routes>
  );
}
