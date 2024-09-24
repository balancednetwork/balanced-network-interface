import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import WalletModal from '@/app/components/WalletModal';
import ApplicationUpdater from '@/store/application/updater';
import TransactionUpdater from '@/store/transactions/updater';

import { AllTransactionsUpdater } from '@/hooks/useTransactionStore';
import { initXWagmiStore, useInitXWagmiStore } from '@/xwagmi/useXWagmiStore';
import { AllXMessagesUpdater } from '@/xwagmi/xcall/zustand/useXMessageStore';
import RootRoutes from './Routes';

function Updaters() {
  return (
    <>
      <TransactionUpdater />
      <ApplicationUpdater />
      <AllTransactionsUpdater />
      <AllXMessagesUpdater />
    </>
  );
}

initXWagmiStore();

export function App() {
  const { i18n } = useTranslation();

  useInitXWagmiStore();

  return (
    <>
      <Updaters />
      <WalletModal />

      <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
      <RootRoutes />
    </>
  );
}
