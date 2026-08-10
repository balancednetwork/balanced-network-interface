import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import NotificationContainer from '@/app/components/Notification/NotificationContainer';
import WalletModal from '@/app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle, Typography } from '@/app/theme';
import ApplicationUpdater from '@/store/application/updater';
import OrderUpdater from '@/store/order/orderUpdater';
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
import { Banner } from './components/Banner';
import { Link } from './components/Link';

function Updaters() {
  return (
    <>
      <MMUpdater />
      <TransactionUpdater />
      <ApplicationUpdater />
      <OrderUpdater />
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
        <Banner messageID="legacy-shutdown-december-1-2026">
          <Typography as="span">
            <strong>Balanced v1 shuts down on December 1, 2026.</strong>
            <br />
            Withdraw your funds and migrate any legacy assets as soon as possible.{' '}
            <Link href="https://docs.balanced.network/" target="_blank" rel="noreferrer">
              View the v1 transition guide.
            </Link>
          </Typography>
        </Banner>

        <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
        <RootRoutes />
      </ThemeProvider>
    </>
  );
}
