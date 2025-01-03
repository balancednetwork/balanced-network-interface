import { xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useXTokenDepositAmount = (
  account: string | undefined | null,
  xToken: XToken | undefined,
): {
  depositAmount: CurrencyAmount<XToken> | undefined;
  refetchDepositAmount: () => Promise<void>;
} => {
  const [result, setResult] = useState<string | undefined>();

  const fetch = useMemo(() => {
    return async (xToken, account) => {
      if (xToken && account) {
        const xTokenOnIcon = xTokenMapBySymbol['0x1.icon'][xToken.symbol];
        const res = await bnJs.Dex.getDepositV2(xTokenOnIcon.address, `${xToken.xChainId}/${account}`);
        setResult(res);
      }
    };
  }, []);

  useEffect(() => {
    fetch(xToken, account);
  }, [fetch, xToken, account]);

  const depositAmount = useMemo(() => {
    return xToken && result ? CurrencyAmount.fromRawAmount<XToken>(xToken, BigInt(result)) : undefined;
  }, [xToken, result]);

  const refetch = useCallback(() => fetch(xToken, account), [fetch, xToken, account]);

  return { depositAmount, refetchDepositAmount: refetch };
};
