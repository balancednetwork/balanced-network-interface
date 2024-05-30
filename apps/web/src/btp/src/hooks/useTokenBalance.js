import { useState, useEffect } from 'react';

import { useBTPSelector } from '../store';
import { accountSelector } from '../store/models/account';
import { useGetBTPService } from './useService';

export const useTokenBalance = coinNames => {
  const [balances, setBalance] = useState([]);
  const getBTPService = useGetBTPService();
  const { accountInfo } = useBTPSelector(accountSelector);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (accountInfo != null) {
      const { address, balance, symbol } = accountInfo;
      const fetchBalances = async () => {
        const result = await Promise.all(
          coinNames.map(async coin => {
            const isNativeCoin = coin.label === symbol;
            if (isNativeCoin) {
              return { ...coin, balance };
            } else {
              return getBTPService()
                .getBalanceOf({ address, symbol: coin.label })
                .then(result => {
                  return { ...coin, balance: result };
                });
            }
          }),
        );
        setBalance(result);
      };

      fetchBalances();
    }
  }, [accountInfo?.balance, accountInfo?.id, getBTPService]);
  return balances;
};
