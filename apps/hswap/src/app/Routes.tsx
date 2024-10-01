import React, { useEffect } from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Outlet, Route, Routes, redirect, useLocation } from 'react-router-dom';

import { DefaultLayout } from '@/app/components/Layout';

import { TradePageLayout } from './pages/trade/layout';
import { TradePage } from './pages/trade/xswap/page';

const routeTexts: [string, MessageDescriptor][] = [
  ['/vote', defineMessage({ message: 'Vote' })],
  ['/trade', defineMessage({ message: 'Trade' })],
  ['/legacy-bridge', defineMessage({ message: 'Legacy bridge' })],
  ['/', defineMessage({ message: 'Home' })],
];

export default function RootRoutes() {
  const location = useLocation();
  const title = routeTexts.find(item => location.pathname.startsWith(item[0]))?.[1];

  return (
    <Routes>
      <Route
        element={
          <>
            <DefaultLayout title={title?.id}>
              <Helmet>
                <title>{title?.message}</title>
              </Helmet>
              <TradePageLayout />
            </DefaultLayout>
          </>
        }
      >
        <Route index element={<TradePage />} />
        <Route path="swap">
          <Route index element={<TradePage />} />
          <Route path=":pair" element={<TradePage />} />
        </Route>
        <Route path="limit" element={<div className="text-foreground">Limit feature soon</div>} />
        <Route path="dca" element={<div className="text-foreground">DCA feature soon</div>} />
      </Route>
    </Routes>
  );
}
