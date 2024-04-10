import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';

import NotificationContainer from 'app/components/Notification/NotificationContainer';
import WalletModal from 'app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from 'app/theme';
import ApplicationUpdater from 'store/application/updater';
import TransactionUpdater from 'store/transactions/updater';

import { useICONEventListener } from './_xcall/_icon/eventHandlers';
import { useArchwayEventListener } from './_xcall/archway/eventHandler';
import TransferAssetsModal from './components/BTP/index';
import { ClaimGoodwill } from './containers/Claim/Goodwill';
import { Claim } from './containers/Claim/LegacyFees';
import RootRoutes from './Routes';

function Updaters() {
  return (
    <>
      <TransactionUpdater />
      <ApplicationUpdater />
    </>
  );
}

export function App() {
  const { i18n } = useTranslation();
  useArchwayEventListener();
  useICONEventListener();

  return (
    <>
      <FixedGlobalStyle />
      <Updaters />

      <ThemeProvider>
        <ThemedGlobalStyle />
        <NotificationContainer />
        <WalletModal />
        <TransferAssetsModal />
        {/* Add message for community */}

        <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
        <Routes>
          <Route path="/claim-legacy-fees" element={<Claim />} />
          <Route path="/claim-goodwill" element={<ClaimGoodwill />} />
          <Route path="*" element={<RootRoutes />} />
        </Routes>
      </ThemeProvider>
    </>
  );
}
