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
        <Banner messageID="legacy-offline-end-2026">
          <Typography as="span">
            <strong>Balanced v1 is a legacy app that will go offline at the end of 2026.</strong> Withdraw your funds
            from the loan, Savings Rate, and liquidity pool features as soon as possible.
            <br />
            <br />
            Can’t repay your loan?{' '}
            <Link href="https://docs.balanced.network/move-loan" target="_blank" rel="noreferrer">
              Learn how to move your loan to Balanced v2.
            </Link>
          </Typography>
        </Banner>

        <Helmet titleTemplate="%s | Balanced" defaultTitle="Balanced" htmlAttributes={{ lang: i18n.language }} />
        <RootRoutes />
      </ThemeProvider>
    </>
  );
}
