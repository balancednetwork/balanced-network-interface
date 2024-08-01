import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import NotificationContainer from 'app/components/Notification/NotificationContainer';
import WalletModal from 'app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from 'app/theme';
import ApplicationUpdater from 'store/application/updater';
import TransactionUpdater from 'store/transactions/updater';

import RootRoutes from './Routes';
import { AllTransactionsUpdater } from './pages/trade/bridge/_zustand/useTransactionStore';
import { AllXMessagesUpdater } from './pages/trade/bridge/_zustand/useXMessageStore';
import { AllPublicXServicesCreator, AllXChainHeightsUpdater } from './pages/trade/bridge/_zustand/useXServiceStore';
import { xChains } from './pages/trade/bridge/_config/xChains';

function Updaters() {
  return (
    <>
      <TransactionUpdater />
      <ApplicationUpdater />
      <AllTransactionsUpdater />
      <AllXMessagesUpdater />
      <AllPublicXServicesCreator xChains={xChains} />
      <AllXChainHeightsUpdater xChains={xChains} />
    </>
  );
}

export function App() {
  const { i18n } = useTranslation();

  return (
    <>
      <FixedGlobalStyle />
      <Updaters />

      <ThemeProvider>
        <ThemedGlobalStyle />
        <NotificationContainer />
        <WalletModal />
        {/* Add message for community */}

        <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
        <RootRoutes />
      </ThemeProvider>
    </>
  );
}
