import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import NotificationContainer from '@/app/components/Notification/NotificationContainer';
import WalletModal from '@/app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from '@/app/theme';
import ApplicationUpdater from '@/store/application/updater';
import TransactionUpdater from '@/store/transactions/updater';

import {
  AllTransactionsUpdater,
  AllXChainHeightsUpdater,
  AllXMessagesUpdater,
  initXWagmiStore,
  useInitXWagmiStore,
  xChains,
} from '@balancednetwork/xwagmi';
import RootRoutes from './Routes';

function Updaters() {
  return (
    <>
      <TransactionUpdater />
      <ApplicationUpdater />
      <AllTransactionsUpdater />
      <AllXMessagesUpdater />
      <AllXChainHeightsUpdater xChains={xChains} />
    </>
  );
}

initXWagmiStore();

export function App() {
  const { i18n } = useTranslation();

  useInitXWagmiStore();

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
