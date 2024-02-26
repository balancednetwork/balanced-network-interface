import React from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Switch, Route, useLocation } from 'react-router-dom';

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

export default function Routes() {
  const location = useLocation();

  const title = routeTexts.find(item => location.pathname.startsWith(item[0]))?.[1];

  return (
    <DefaultLayout title={title?.id}>
      <Helmet>
        <title>{title?.message}</title>
      </Helmet>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route exact path="/vote" component={VotePage} />
        <Route exact path="/vote/proposal-list" component={ProposalList} />
        <Route exact path="/trade" component={TradePage} />
        <Route exact path="/trade/:pair" component={TradePage} />
        <Route exact path="/trade/supply" component={TradePage} />
        <Route exact path="/trade/supply/:pair" component={TradePage} />
        <Route exact path="/trade/bridge/" component={TradePage} />
        <Route path="/vote/new-proposal" component={NewProposalPage} />
        <Route path="/vote/proposal/:id" component={ProposalPage} />
        <Route
          exact
          path="/airdrip"
          component={() => {
            window.location.href = 'https://balanced.network/';
            return null;
          }}
        />
        <Route
          component={() => {
            window.location.href = 'https://balanced.network/404';
            return null;
          }}
        />
      </Switch>
    </DefaultLayout>
  );
}
