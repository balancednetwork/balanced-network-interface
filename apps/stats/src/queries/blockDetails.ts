import { useMemo } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useWhitelistedTokensList } from '@/queries';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import bnJs from '@/bnJs';
import { SUPPORTED_TOKENS_LIST, TOKEN_BLACKLIST } from '@/constants/tokens';

import { useAllPairs, useAllTokens, useAllTokensByAddress } from './backendv2';

export const API_ENDPOINT = 'https://tracker.icon.community/api/v1/';

const stabilityFundAddress = addresses[1].stabilityfund;

export type BlockDetails = {
  timestamp: number;
  number: number;
};

export const useBlockDetails = (timestamp: number) => {
  const getBlock = async (): Promise<BlockDetails> => {
    const { data } = await axios.get(`${API_ENDPOINT}blocks/timestamp/${timestamp * 1000}`);
    return data;
  };
  return useQuery<BlockDetails>({ queryKey: [`getBlock`, timestamp], queryFn: getBlock });
};

export const useHoldings = (timestamp: number, holder: string) => {
  const { data: blockDetails } = useBlockDetails(timestamp);
  const { data: allTokens, isSuccess: allTokensQuerySuccess } = useAllTokens();
  const blockHeight = blockDetails?.number;

  const filteredTokens = useMemo(() => {
    if (allTokens) {
      return allTokens.filter(token => token.address !== 'ICX' && token.symbol !== 'USDS');
    } else {
      return [];
    }
  }, [allTokens]);

  return useQuery<{ [key: string]: CurrencyAmount<Currency> }>({
    queryKey: [`holdings`, holder, blockHeight, `tokens`, filteredTokens.length],
    queryFn: async () => {
      const currencyAmounts: CurrencyAmount<Currency>[] = await Promise.all(
        filteredTokens.map(async tokenData => {
          const token = new Token(1, tokenData.address, tokenData.decimals, tokenData.symbol, tokenData.name);
          try {
            const contract = bnJs.getContract(token.address);
            const balance = await contract.balanceOf(holder, blockHeight);
            return CurrencyAmount.fromRawAmount(token, balance);
          } catch (e) {
            console.error(e);
            return CurrencyAmount.fromRawAmount(token, 0);
          }
        }),
      );
      const holdings = {};
      currencyAmounts.forEach(currencyAmount => (holdings[currencyAmount.currency.wrapped.address] = currencyAmount));
      return holdings;
    },
    placeholderData: keepPreviousData,
    enabled: allTokensQuerySuccess,
  });
};

export const useStabilityFundHoldings = (timestamp: number) => {
  const { data: addresses } = useWhitelistedTokensList();
  const { data: blockDetails } = useBlockDetails(timestamp);
  const whitelistedTokens = addresses || [];
  const blockHeight = blockDetails?.number;

  return useQuery<{ [key: string]: CurrencyAmount<Currency> }>({
    queryKey: [`stabilityFundHoldings`, whitelistedTokens?.length, blockHeight],
    queryFn: async () => {
      const currencyAmounts: CurrencyAmount<Currency>[] = await Promise.all(
        whitelistedTokens
          .filter(address => !TOKEN_BLACKLIST.some(token => token.address === address))
          .filter(address => SUPPORTED_TOKENS_LIST.find(token => token.address === address))
          .map(async address => {
            const token = SUPPORTED_TOKENS_LIST.filter(token => token.address === address)[0];
            try {
              const contract = bnJs.getContract(address);
              const balance = await contract.balanceOf(stabilityFundAddress, blockHeight);
              return CurrencyAmount.fromRawAmount(token, balance);
            } catch (e) {
              console.error(e);
              return CurrencyAmount.fromRawAmount(token, 0);
            }
          }),
      );
      const holdings = {};
      currencyAmounts.forEach(currencyAmount => (holdings[currencyAmount.currency.wrapped.address] = currencyAmount));
      return holdings;
    },
  });
};

export const usePOLData = (timestamp: number) => {
  const { data: allPairs, isSuccess: allPairsQuerySuccess } = useAllPairs();
  const { data: allTokens, isSuccess: allTokensQuerySuccess } = useAllTokensByAddress();
  const { data: blockDetails } = useBlockDetails(timestamp);
  const blockHeight = blockDetails?.number;
  const pools = [2, 4, 58, 59];

  return useQuery({
    queryKey: [`POLData`, blockHeight],
    queryFn: async () => {
      const poolDataSets = await Promise.all(
        pools.map(async poolID => {
          const balanceUnstaked = await bnJs.Dex.balanceOf(bnJs.DAOFund.address, poolID, blockHeight);
          const balanceStaked = await bnJs.StakedLP.balanceOf(bnJs.DAOFund.address, poolID, blockHeight);
          const poolStats = await bnJs.Dex.getPoolStats(poolID, blockHeight);

          return {
            poolID,
            balance: new BigNumber(balanceUnstaked).plus(new BigNumber(balanceStaked)).div(10 ** 18),
            poolStats,
          };
        }),
      );

      return poolDataSets.map(dataSet => {
        const LPBalanceDAO = dataSet.balance;
        const LPBalanceTotal = new BigNumber(dataSet.poolStats['total_supply']).div(10 ** 18);
        const DAOFraction = LPBalanceDAO.div(LPBalanceTotal);
        const quoteAmount = new BigNumber(dataSet.poolStats['quote']).div(
          10 ** parseInt(dataSet.poolStats['quote_decimals'], 16),
        );
        const baseAmount = new BigNumber(dataSet.poolStats['base']).div(
          10 ** parseInt(dataSet.poolStats['base_decimals'], 16),
        );
        const quoteValue = quoteAmount.times(allTokens ? allTokens[dataSet.poolStats['quote_token']].price : 1);
        const poolLiquidity = quoteValue.times(2);
        const poolData = {
          id: dataSet.poolID,
          liquidity: poolLiquidity.div(LPBalanceTotal).times(LPBalanceDAO),
          pair: allPairs?.find(pair => parseInt(pair.id) === dataSet.poolID),
          DAOQuoteAmount: quoteAmount.times(DAOFraction),
          DAOBaseAmount: baseAmount.times(DAOFraction),
        };

        return poolData;
      });
    },
    enabled: allPairsQuerySuccess && allTokensQuerySuccess,
    placeholderData: keepPreviousData,
  });
};
