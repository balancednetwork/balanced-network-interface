import bnJs from '@/bnJs';
import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { NATIVE_ADDRESS } from '@/constants/index';
import { xTokenMap } from '@/constants/xTokens';
import { XChainId, XToken } from '@/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

type XAddress = string;
type Address = string;

type ResultMap = {
  [xAddress: XAddress]: {
    address: Address;
    depositedAmount: CurrencyAmount<XToken>;
    limit: CurrencyAmount<XToken>;
  };
};

const getXChainDecimalDifference = (xToken: XToken) => {
  const iconToken = xTokenMap[ICON_XCALL_NETWORK_ID]?.find(t => t.symbol === xToken.symbol);
  if (iconToken) {
    return iconToken.decimals - xToken.decimals;
  }
  return 0;
};

const fixDecimalDifference = (amount: string, decimalsDifference: number) => {
  const amountBN = new BigNumber(amount);
  if (decimalsDifference > 0) {
    return amountBN.dividedBy(10 ** decimalsDifference).toFixed(0);
  } else {
    return amountBN.multipliedBy(10 ** decimalsDifference).toFixed(0);
  }
};

export function useAssetManagerTokens(): UseQueryResult<ResultMap> {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  return useQuery({
    queryKey: ['assetManagerStatus', now],
    queryFn: async () => {
      const tokensMap: { [xAddress: XAddress]: Address } = await bnJs.AssetManager.getAssets();

      const res = await Promise.all(
        Object.keys(tokensMap).map(async xAddress => {
          const amount: string = await bnJs.AssetManager.getAssetDeposit(xAddress);
          const limit: string = await bnJs.AssetManager.getAssetChainDepositLimit(xAddress);
          return [amount, limit];
        }),
      );

      const result: ResultMap = {};

      Object.keys(tokensMap).forEach((xAddress: XAddress, index) => {
        const [amount, limit] = res[index];
        const xChainId = xAddress.split(/\/(.*)/s)[0] as XChainId;
        const address = xAddress.split(/\/(.*)/s)[1];

        const token = xTokenMap[xChainId]?.find(
          t =>
            t.address.toLowerCase() ===
            (address === '0x0000000000000000000000000000000000000000' ? NATIVE_ADDRESS : address).toLowerCase(),
        );

        if (!token) return;

        const decimalsDifference = getXChainDecimalDifference(token);

        result[xAddress] = {
          address: tokensMap[xAddress],
          depositedAmount: CurrencyAmount.fromRawAmount(
            token,
            !!decimalsDifference ? fixDecimalDifference(amount, decimalsDifference) : amount,
          ),
          limit: CurrencyAmount.fromRawAmount(token, limit),
        };
      });

      return result;
    },
  });
}
