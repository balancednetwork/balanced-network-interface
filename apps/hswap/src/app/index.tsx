import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import WalletConnectModal from '@/app/components/WalletConnectModal';
import ApplicationUpdater from '@/store/application/updater';
import TransactionUpdater from '@/store/transactions/updater';
import { Updater as MMUpdater } from '@/store/transactions/useMMTransactionStore';

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
      <MMUpdater />
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

      <Helmet titleTemplate="%s | Hana Swap" defaultTitle="Hana Swap" htmlAttributes={{ lang: i18n.language }} />
      <RootRoutes />
    </>
  );
}
