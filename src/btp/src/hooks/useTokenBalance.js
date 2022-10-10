import { useState, useEffect } from 'react';

import { getService } from 'btp/src/services/transfer';

export const useTokenBalance = coinNames => {
  const [balances, setBalance] = useState([]);
  useEffect(() => {
    if (window['accountInfo'] != null) {
      const { address, balance, symbol } = window['accountInfo'];
      const fetchBalances = async () => {
        const result = await Promise.all(
          coinNames.map(async coin => {
            const isNativeCoin = coin.label === symbol;
            if (isNativeCoin) {
              return { ...coin, balance };
            } else {
              return getService()
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
  }, [window['accountInfo']]);
  return balances;
};
