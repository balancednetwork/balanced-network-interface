import { getXAddress } from '@/utils/xTokens';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { NATIVE_ADDRESS } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { bnJs } from '@balancednetwork/xwagmi';
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
  const iconToken = xTokenMap['0x1.icon'].find(t => t.symbol === xToken.symbol);
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
  return useQuery({
    queryKey: ['assetManagerState'],
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
        let address = xAddress.split(/\/(.*)/s)[1];
        if (xChainId === 'sui') {
          address = '0x' + address;
        }

        const token = xTokenMap[xChainId]?.find(
          t =>
            t.address.toLowerCase() ===
            (address === '0x0000000000000000000000000000000000000000' ||
            address === '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI' ||
            address === '11111111111111111111111111111111'
              ? NATIVE_ADDRESS
              : address
            ).toLowerCase(),
        );

        if (!token) return;

        const decimalsDifference = getXChainDecimalDifference(token);

        const _xAddress = getXAddress(token)!;
        result[_xAddress] = {
          address: tokensMap[_xAddress],
          depositedAmount: CurrencyAmount.fromRawAmount(
            token,
            !!decimalsDifference ? fixDecimalDifference(amount, decimalsDifference) : amount,
          ),
          limit: CurrencyAmount.fromRawAmount(token, limit),
        };
      });

      return result;
    },
    refetchInterval: 1000 * 60,
  });
}
