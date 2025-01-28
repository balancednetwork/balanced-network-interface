import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { convertCurrency, convertCurrencyAmount } from '@/utils';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

export const useXTokenDepositAmount = (
  account: string | undefined | null,
  xToken: XToken | undefined,
): UseQueryResult<CurrencyAmount<XToken> | undefined, Error> => {
  const fetchDepositAmount = async () => {
    if (xToken && account) {
      const xTokenOnIcon = convertCurrency(ICON_XCALL_NETWORK_ID, xToken)!;
      const res = await bnJs.Dex.getDepositV2(xTokenOnIcon.address, `${xToken.xChainId}/${account}`);

      return res
        ? convertCurrencyAmount(xToken.xChainId, CurrencyAmount.fromRawAmount<XToken>(xTokenOnIcon, BigInt(res)))
        : undefined;
    }
    return undefined;
  };

  return useQuery({
    queryKey: ['XTokenDepositAmount', xToken, account],
    queryFn: fetchDepositAmount,
    enabled: !!xToken && !!account,
  });
};
