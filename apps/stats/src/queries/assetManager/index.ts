import bnJs from '@/bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

const networkAddressToName = {
  '0x100.icon': 'ICON',
  '0xa86a.avax': 'Avalanche',
  '0x38.bsc': 'BNB Chain',
  'injective-1': 'Injective',
  'archway-1': 'Archway',
  '0xa4b1.arbitrum': 'Arbitrum',
  '0x2105.base': 'Base',
  '0xa.optimism': 'Optimism',
  '0x89.polygon': 'Polygon',
};

export const getNetworkName = (networkAddress: string) => {
  return networkAddressToName[networkAddress] || networkAddress;
};

export type AssetManagerToken = {
  networkAddress: string;
  networkName: string;
  tokenAmount: CurrencyAmount<Token>;
  tokenLimit: CurrencyAmount<Token>;
};

type AssetManagerTokenBreakdown = {
  [tokenAddress: string]: AssetManagerToken[];
};

export function useAssetManagerTokens(): UseQueryResult<AssetManagerTokenBreakdown | undefined> {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  return useQuery({
    queryKey: [`assetManagerTokens-t`, now],
    queryFn: async () => {
      const tokensRaw: { [key: string]: string } = await bnJs.AssetManager.getAssets();
      const tokens: { [tokenAddress: string]: string[] } =
        tokensRaw &&
        Object.entries(tokensRaw).reduce((tokenNetworks, [networkAddress, tokenAddress]) => {
          if (!tokenNetworks[tokenAddress]) {
            tokenNetworks[tokenAddress] = [networkAddress];
          } else {
            tokenNetworks[tokenAddress].push(networkAddress);
          }
          return tokenNetworks;
        }, {});

      if (!tokens) return;

      const tokensBreakdown = await Promise.all(
        Object.entries(tokens).map(async ([tokenAddress, networks]) => {
          const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[tokenAddress];

          if (!token) return [tokenAddress, []];

          const tokenData = await Promise.all(
            networks.map(async networkAddress => {
              const amount = await bnJs.AssetManager.getAssetDeposit(networkAddress);
              const limit = await bnJs.AssetManager.getAssetChainDepositLimit(networkAddress);

              const data: AssetManagerToken = {
                networkAddress,
                networkName: getNetworkName(networkAddress.split('/')[0]),
                tokenAmount: CurrencyAmount.fromRawAmount(token, amount),
                tokenLimit: CurrencyAmount.fromRawAmount(token, limit),
              };

              return data;
            }),
          );
          return [
            tokenAddress,
            tokenData.sort((a, b) => (a.tokenAmount.subtract(b.tokenAmount).greaterThan(0) ? -1 : 1)),
          ];
        }),
      ).then(data => Object.fromEntries(data));

      return tokensBreakdown;
    },
  });
}
