import { useState, useEffect } from 'react';

import { tokenToUsd } from 'btp/src/services/btpServices';

function useTokenToUsd(unit, balance, shouldFetch = true) {
  const [usdBalance, setUsdBalance] = useState(0);
  useEffect(() => {
    const getUsbalance = async () => {
      if (!unit || !balance) {
        setUsdBalance(0);
      } else {
        try {
          const usdBalance = await tokenToUsd(unit, balance);
          setUsdBalance(parseFloat(usdBalance?.content[0]?.value));
        } catch (error) {
          console.log(error);
        }
      }
    };
    if (shouldFetch) getUsbalance();
  }, [balance, unit, shouldFetch]);

  return usdBalance;
}

export { useTokenToUsd };
