import React from 'react';

import { Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, BrowserRouter, Routes } from 'react-router-dom';

import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from '@/theme';

import { PerformanceDetailsPage } from './pages/PerformanceDetails/Loadable';
import { StatsPage } from './pages/StatsPage/Loadable';

const queryClient = new QueryClient();

const NotFound = () => {
  window.location.href = 'https://balanced.network/404';
  return null;
};

export function App() {
  return (
    <>
      <FixedGlobalStyle />
      <ThemeProvider>
        <ThemedGlobalStyle />

        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Helmet htmlAttributes={{ lang: 'en' }}>
              <meta name="description" content="A Balanced Network interface" />
            </Helmet>

            <Routes>
              <Route path="/" element={<StatsPage />} />
              <Route path="/performance-details" element={<PerformanceDetailsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}
