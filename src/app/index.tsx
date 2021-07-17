import React from 'react';

import { IconReactProvider } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import NotificationContainer from 'app/components/Notification/NotificationContainer';
import WalletModal from 'app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from 'app/theme';
import TransactionUpdater from 'store/transactions/updater';

import { Airdrip } from './containers/Airdrip/Loadable';
import { HomePage } from './containers/HomePage/Loadable';
import { ProposalPage } from './containers/ProposalPage/Loadable';
import { TradePage } from './containers/TradePage/Loadable';
import { VotePage } from './containers/VotePage/Loadable';

function Updaters() {
  return (
    <>
      <TransactionUpdater />
    </>
  );
}

export function App() {
  const { i18n } = useTranslation();

  return (
    <>
      <FixedGlobalStyle />
      <IconReactProvider>
        <Updaters />

        <ThemeProvider>
          <ThemedGlobalStyle />
          <NotificationContainer />
          <WalletModal />

          <BrowserRouter>
            <Helmet
              titleTemplate="%s - Balanced Network"
              defaultTitle="Balanced Network"
              htmlAttributes={{ lang: i18n.language }}
            >
              <meta name="description" content="A Balanced Network interface" />
            </Helmet>

            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route exact path="/vote" component={VotePage} />
              <Route exact path="/trade" component={TradePage} />
              <Route exact path="/airdrip" component={Airdrip} />
              <Route path="/vote/proposal/:id" component={ProposalPage} />
              <Route
                component={() => {
                  window.location.href = 'https://balanced.network/404';
                  return null;
                }}
              />
            </Switch>
          </BrowserRouter>
        </ThemeProvider>
      </IconReactProvider>
    </>
  );
}
