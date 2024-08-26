import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import NotificationContainer from '@/app/components/Notification/NotificationContainer';
import WalletModal from '@/app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from '@/app/theme';
import ApplicationUpdater from '@/store/application/updater';
import TransactionUpdater from '@/store/transactions/updater';

import { AllTransactionsUpdater } from '@/lib/xcall/_zustand/useTransactionStore';
import { AllXMessagesUpdater } from '@/lib/xcall/_zustand/useXMessageStore';
import { AllXChainHeightsUpdater } from '@/lib/xcall/_zustand/useXServiceStore';
import { initXWagmiStore } from '@/xwagmi/useXWagmiStore';
import { xChains } from '../constants/xChains';
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
