import bnJs from '@/bnJs';
import { NATIVE_ADDRESS } from '@/constants/index';
import { xTokenMap } from '@/constants/xTokens';
import { XToken } from '@/types';
import { XChainId } from '@/xwagmi/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

type XAddress = string;
type Address = string;

type ResultMap = {
  [xAddress: XAddress]: {
    address: Address;
    depositedAmount: CurrencyAmount<XToken>;
    limit: CurrencyAmount<XToken>;
  };
};

export function useAssetManagerTokens(): UseQueryResult<ResultMap> {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  return useQuery({
    queryKey: ['assetManagerStatus', now],
    queryFn: async () => {
      // 0x38.bsc/0x2170Ed0880ac9A755fd29B2688956BD959F933F8 -> cx288d13e1b63563459a2ac6179f237711f6851cb5
      // xToken Address -> icon Token Address
      // xAddress = xChainId + '/' + address
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

        result[xAddress] = {
          address: tokensMap[xAddress],
          depositedAmount: CurrencyAmount.fromRawAmount(token, amount),
          limit: CurrencyAmount.fromRawAmount(token, limit),
        };
      });

      return result;
    },
  });
}
