import React from 'react';

import { IconReactProvider } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from 'app/theme';

import { NotFoundPage } from './components/NotFoundPage/Loadable';
import { HomePage } from './containers/HomePage/Loadable';
import { StyleGuidePage } from './containers/StyleGuidePage';
import { TradePage } from './containers/TradePage';
import { VotePage } from './containers/VotePage';

export function App() {
  const { i18n } = useTranslation();

  return (
    <>
      <FixedGlobalStyle />
      <ThemeProvider>
        <ThemedGlobalStyle />

        <IconReactProvider>
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
              <Route exact path="/style-guide" component={StyleGuidePage} />
              <Route component={NotFoundPage} />
            </Switch>
          </BrowserRouter>
        </IconReactProvider>
      </ThemeProvider>
    </>
  );
}
