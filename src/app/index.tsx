import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from 'app/theme';

import { NotFoundPage } from './components/NotFoundPage/Loadable';
import { HomePage } from './containers/HomePage/Loadable';
import { StyleGuidePage } from './containers/StyleGuidePage';

export function App() {
  const { i18n } = useTranslation();

  return (
    <>
      <FixedGlobalStyle />
      <ThemeProvider>
        <ThemedGlobalStyle />

        <BrowserRouter>
          <Helmet
            titleTemplate="%s - React Boilerplate"
            defaultTitle="React Boilerplate"
            htmlAttributes={{ lang: i18n.language }}
          >
            <meta name="description" content="A React Boilerplate application" />
          </Helmet>

          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route exact path="/style-guide" component={StyleGuidePage} />
            <Route component={NotFoundPage} />
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}
