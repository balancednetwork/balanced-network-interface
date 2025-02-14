import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { convertCurrency, convertCurrencyAmount } from '@/utils';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

export const useXLockedAmount = (
  account: string | undefined | null, // user network address - e.g. '0xa4b1.arbitrum/0x1234567890abcdef'
  xToken: XToken | undefined,
): UseQueryResult<CurrencyAmount<XToken> | null, Error> => {
  const fetchLockedAmount = async () => {
    if (xToken && account) {
      const res = await bnJs.Savings.getLockedAmount(`${xToken.xChainId}/${account}`);

      const xTokenOnIcon = convertCurrency(ICON_XCALL_NETWORK_ID, xToken)!;
      return res
        ? convertCurrencyAmount(xToken.xChainId, CurrencyAmount.fromRawAmount<XToken>(xTokenOnIcon, BigInt(res)))
        : null;
    }
    return null;
  };

  return useQuery({
    queryKey: ['xLockedAmount', xToken?.id, account],
    queryFn: fetchLockedAmount,
    enabled: !!xToken && !!account,
  });
};
