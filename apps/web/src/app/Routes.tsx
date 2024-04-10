import React from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation } from 'react-router-dom';

import { DefaultLayout } from 'app/components/Layout';

import { HomePage } from './containers/HomePage/Loadable';
import { NewProposalPage } from './containers/NewProposalPage/Loadable';
import { ProposalPage } from './containers/ProposalPage/Loadable';
import { TradePage } from './containers/TradePage/Loadable';
import { VotePage } from './containers/VotePage/Loadable';
import { ProposalList } from './containers/VotePage/ProposalsPanel/ProposalList';

const routeTexts: [string, MessageDescriptor][] = [
  ['/vote', defineMessage({ message: 'Vote' })],
  ['/trade', defineMessage({ message: 'Trade' })],
  ['/', defineMessage({ message: 'Home' })],
];

export default function RootRoutes() {
  const location = useLocation();

  const title = routeTexts.find(item => location.pathname.startsWith(item[0]))?.[1];

  return (
    <DefaultLayout title={title?.id}>
      <Helmet>
        <title>{title?.message}</title>
      </Helmet>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vote" element={<VotePage />} />
        <Route path="/vote/proposal-list" element={<ProposalList />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/trade/:pair" element={<TradePage />} />
        <Route path="/trade/supply" element={<TradePage />} />
        <Route path="/trade/supply/:pair" element={<TradePage />} />
        <Route path="/trade/bridge/" element={<TradePage />} />
        <Route path="/vote/new-proposal" element={<NewProposalPage />} />
        <Route path="/vote/proposal/:id" element={<ProposalPage />} />
        <Route
          path="/airdrip"
          element={<>Empty</>}
          // element={() => {
          //   window.location.href = 'https://balanced.network/';
          //   return null;
          // }}
        />
        <Route
          element={<>Empty</>}
          // element={() => {
          //   window.location.href = 'https://balanced.network/404';
          //   return null;
          // }}
        />
      </Routes>
    </DefaultLayout>
  );
}
