import { useEffect, useState } from 'react';

import { useBTPSelector } from '../store';
import { accountSelector } from '../store/models/account';
import { useGetBTPService } from './useService';

export const useTokenBalance = coinNames => {
  const [balances, setBalance] = useState([]);
  const getBTPService = useGetBTPService();
  const { accountInfo } = useBTPSelector(accountSelector);
  console.log('useTokenBalance', 'accountInfo', accountInfo);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    console.log('useTokeknBalance', 'useEffect');
    if (accountInfo != null) {
      const { address, balance, symbol } = accountInfo;
      console.log('useTokenBalance', 'address', address, balance, symbol);
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
        console.log('useTokenBalance', 'result', result);
        setBalance(result);
      };

      fetchBalances();
    }
  }, [accountInfo?.balance, accountInfo?.id, getBTPService]);
  return balances;
};
