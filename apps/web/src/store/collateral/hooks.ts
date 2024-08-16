import React, { useMemo } from 'react';

import { CallData, addresses } from '@balancednetwork/balanced-js';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from '@/bnJs';
import { ICON_XCALL_NETWORK_ID, NETWORK_ID } from '@/constants/config';
import { MINIMUM_ICX_FOR_ACTION } from '@/constants/index';
import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { useOraclePrice } from '@/store/oracle/hooks';
import { useRatio } from '@/store/ratio/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useCrossChainWalletBalances, useICONWalletBalances } from '@/store/wallet/hooks';
import { CurrencyKey, IcxDisplayType } from '@/types';
import { formatUnits, maxAmountSpend, toBigNumber } from '@/utils';

import { useDestinationEvents } from '@/app/pages/trade/bridge/_zustand/useXCallEventStore';
import { SUPPORTED_XCALL_CHAINS, xChainMap } from '@/constants/xChains';
import { DEFAULT_TOKEN_CHAIN, xTokenMap } from '@/constants/xTokens';
import { useAvailableWallets, useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { Position, XChainId, XPositionsRecord, XToken } from '@/types';
import { getBalanceDecimals } from '@/utils/formatter';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { AppState } from '../index';
import {
  Field,
  adjust,
  cancel,
  changeCollateralType as changeCollateralTypeAction,
  changeCollateralXChain as changeCollateralXChainAction,
  changeDepositedAmount as changeDepositedAmountAction,
  changeIcxDisplayType,
  type,
} from './reducer';

export const DEFAULT_COLLATERAL_TOKEN = 'sICX';

export function useCollateralChangeIcxDisplayType(): (icxDisplayType: IcxDisplayType) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (icxDisplayType: IcxDisplayType) => {
      dispatch(changeIcxDisplayType({ icxDisplayType }));
    },
    [dispatch],
  );
}
export function useAllDepositedAmounts() {
  return useSelector((state: AppState) => state.collateral.depositedAmounts);
}

export function useCollateralType() {
  return useSelector((state: AppState) => state.collateral.collateralType);
}

export function useCollateralXChain() {
  return useSelector((state: AppState) => state.collateral.collateralXChain);
}

export function useIcxDisplayType() {
  return useSelector((state: AppState) => state.collateral.icxDisplayType);
}

export function useCollateralAvailableAmount() {
  const icxAddress = bnJs.ICX.address;
  const balances = useICONWalletBalances();
  const ICXAmountCA = balances[icxAddress];
  const ICXAmount = toBigNumber(ICXAmountCA);

  return React.useMemo(() => {
    return BigNumber.max(ICXAmount.minus(MINIMUM_ICX_FOR_ACTION), new BigNumber(0));
  }, [ICXAmount]);
}

export function useCollateralAmounts(xChainId?: XChainId): { [key in string]: BigNumber } {
  const collateralXChain = useCollateralXChain();
  return useSelector((state: AppState) => state.collateral.depositedAmounts[xChainId || collateralXChain] || {});
}

export function useAllCollateralData(): UseQueryResult<XPositionsRecord[]> {
  const { data: totalCollateralData } = useTotalCollateralData();

  return useQuery({
    queryKey: ['getCollateralSelectorData', totalCollateralData],
    queryFn: () => {
      if (!totalCollateralData) return;
      return Object.keys(totalCollateralData)
        .filter(symbol => symbol !== 'BTCB')
        .map(symbol => {
          const baseToken = SUPPORTED_TOKENS_LIST.find(token => token.symbol === symbol);
          const positions = SUPPORTED_XCALL_CHAINS.reduce(
            (acc, xChainId) => {
              const xToken = xTokenMap[xChainId].find(t => t.symbol === symbol);
              if (xToken || xChainId === ICON_XCALL_NETWORK_ID) {
                acc[xChainId] = undefined;
              }
              return acc;
            },
            {} as Partial<{ [key in XChainId]: {} }>,
          );
          return {
            baseToken,
            positions,
            isSingleChain: Object.keys(positions).length === 1,
            total: totalCollateralData[symbol],
          };
        });
    },
    enabled: !!totalCollateralData,
    placeholderData: keepPreviousData,
  });
}

export function useTotalCollateralData(): UseQueryResult<{ [key in string]: Position }> {
  const { data: supportedTokens } = useSupportedCollateralTokens();

  return useQuery({
    queryKey: ['totalCollateralData', supportedTokens],
    queryFn: async () => {
      if (!supportedTokens) return;
      try {
        const totalData = await Promise.all(
          Object.entries(supportedTokens).map(async ([symbol, address]) => {
            const baseToken = SUPPORTED_TOKENS_LIST.find(token => token.symbol === symbol);
            if (!baseToken) return;

            const cds: CallData[] = [
              {
                target: address,
                method: 'balanceOf',
                params: [addresses[NETWORK_ID].loans],
              },
              {
                target: addresses[NETWORK_ID].loans,
                method: 'getTotalCollateralDebt',
                params: [symbol, 'bnUSD'],
              },
            ];

            const data = await bnJs.Multicall.getAggregateData(cds);

            return {
              collateral: CurrencyAmount.fromRawAmount(baseToken, data[0]),
              loan: new BigNumber(data[1]).div(10 ** 18),
            } as Position;
          }),
        );
        return totalData
          .filter((item: any): item is Position => {
            return typeof item === 'object' && 'collateral' in item && 'loan' in item;
          })
          .reduce((acc, { collateral, loan }) => {
            if (!collateral || !loan) return acc;
            acc[collateral.currency.symbol] = { collateral, loan };
            return acc;
          }, {});
      } catch (e) {
        console.error(e);
        return;
      }
    },
    enabled: !!supportedTokens,
    placeholderData: keepPreviousData,
  });
}

export function useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }> {
  return useQuery({
    queryKey: ['getCollateralTokens'],
    queryFn: async () => {
      const data = await bnJs.Loans.getCollateralTokens();

      const cds: CallData[] = Object.keys(data).map(symbol => ({
        target: addresses[NETWORK_ID].loans,
        method: 'getDebtCeiling',
        params: [symbol],
      }));

      const debtCeilingsData = await bnJs.Multicall.getAggregateData(cds);

      const debtCeilings = debtCeilingsData.map(ceiling => (ceiling === null ? 1 : parseInt(formatUnits(ceiling))));

      const supportedTokens = {};
      Object.keys(data).forEach((symbol, index) => {
        //temporarily allow BTCB with 0 debt ceiling
        if (debtCeilings[index] > 0 || symbol === 'BTCB') {
          supportedTokens[symbol] = data[symbol];
        }
      });

      return supportedTokens;
    },
  });
}
