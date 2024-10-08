import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import WalletConnectModal from '@/app/components/WalletConnectModal';
import ApplicationUpdater from '@/store/application/updater';
import TransactionUpdater from '@/store/transactions/updater';

import { AllTransactionsUpdater } from '@/hooks/useTransactionStore';
import { initXWagmiStore, useInitXWagmiStore } from '@/xwagmi/useXWagmiStore';
import { AllXMessagesUpdater } from '@/xwagmi/xcall/zustand/useXMessageStore';
import { AllXChainHeightsUpdater } from '@/xwagmi/xcall/zustand/useXServiceStore';
import { xChains } from '../xwagmi/constants/xChains';
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
      <Updaters />

      <WalletConnectModal />

      <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
      <RootRoutes />
    </>
  );
}
