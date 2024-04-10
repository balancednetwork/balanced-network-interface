import React from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/macro';
import { Helmet } from 'react-helmet-async';
import { Switch, Route, useLocation } from 'react-router-dom';
import { CompatRoute } from 'react-router-dom-v5-compat';

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
        <CompatRoute exact path="/" component={HomePage} />
        <CompatRoute exact path="/vote" component={VotePage} />
        <CompatRoute exact path="/vote/proposal-list" component={ProposalList} />
        <CompatRoute exact path="/trade" component={TradePage} />
        <CompatRoute exact path="/trade/:pair" component={TradePage} />
        <CompatRoute exact path="/trade/supply" component={TradePage} />
        <CompatRoute exact path="/trade/supply/:pair" component={TradePage} />
        <CompatRoute exact path="/trade/bridge/" component={TradePage} />
        <CompatRoute path="/vote/new-proposal" component={NewProposalPage} />
        <CompatRoute path="/vote/proposal/:id" component={ProposalPage} />
        <CompatRoute
          exact
          path="/airdrip"
          component={() => {
            window.location.href = 'https://balanced.network/';
            return null;
          }}
        />
        <CompatRoute
          component={() => {
            window.location.href = 'https://balanced.network/404';
            return null;
          }}
        />
      </Switch>
    </DefaultLayout>
  );
}
