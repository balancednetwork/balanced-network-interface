import React from 'react';

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import NotificationContainer from '@/app/components/Notification/NotificationContainer';
import WalletModal from '@/app/components/WalletModal';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle, Typography } from '@/app/theme';
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
import { Banner } from './components/Banner';
import { Link } from './components/Link';

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
      <FixedGlobalStyle />
      <Updaters />

      <ThemeProvider>
        <ThemedGlobalStyle />
        <NotificationContainer />
        <WalletModal />
        {false && (
          <Banner messageID="solana-outage">
            <Typography as="span">
              Solana activities are temporarily unavailable. Functionality will be restored after an issue has been
              resolved.
            </Typography>
          </Banner>
        )}

        <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
        <RootRoutes />
      </ThemeProvider>
    </>
  );
}
