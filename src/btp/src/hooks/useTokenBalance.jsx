import { useState, useEffect } from 'react';

import { useSelect } from 'btp/src/hooks/useRematch';
import { getService } from 'btp/src/services/transfer';

export const useTokenBalance = currentSymbol => {
  const [token, setToken] = useState({ balance: null, symbol: currentSymbol });

  // const {
  //   accountInfo: { address, balance, unit, currentNetwork },
  // } = useSelect(({ account: { selectAccountInfo } }) => ({
  //   accountInfo: selectAccountInfo,
  // }));

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (window['accountInfo'] != null) {
      const { address, balance, symbol, currentNetwork } = window['accountInfo'];
      if (currentNetwork && currentSymbol?.length > 0) {
        const isNativeCoin = currentSymbol === symbol;

        if (isNativeCoin) {
          setToken({ balance, symbol: symbol });
        } else {
          getService()
            .getBalanceOf({ address, symbol: currentSymbol })
            .then(result => {
              setToken({ balance: result, symbol: currentSymbol });
            });
        }
      }
    }
  }, [window['accountInfo']]);

  return [token.balance, token.symbol];
};
