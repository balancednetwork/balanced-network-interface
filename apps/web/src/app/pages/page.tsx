import React from 'react';

import { useIconReact } from '@/packages/icon-react';
import styled from 'styled-components';

import CollateralPanel from '@/app/components/home/CollateralPanel';
import LoanPanel from '@/app/components/home/LoanPanel';
import PositionDetailPanel from '@/app/components/home/PositionDetailPanel';
import { useFetchBBalnInfo, useFetchBBalnSources } from '@/store/bbaln/hooks';
import { useCollateralFetchInfo } from '@/store/collateral/hooks';
import { useLoanFetchInfo } from '@/store/loan/hooks';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchSavingsInfo } from '@/store/savings/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

export function HomePage() {
  const { account } = useIconReact();

  useFetchPrice();
  useFetchOraclePrices();
  useFetchBBalnSources();
  useFetchBBalnInfo(account);
  useFetchSavingsInfo(account);
  useWalletFetchBalances();
  useCollateralFetchInfo(account);
  useLoanFetchInfo(account);

  return (
    <>
      <CollateralPanel />
      <LoanPanel />
      <PositionDetailPanel />
    </>
  );
}
