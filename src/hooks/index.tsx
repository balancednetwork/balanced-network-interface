import React from 'react';

import BigNumber from 'bignumber.js';
import { isEoaAddress } from 'icon-sdk-js/lib/data/Validator.js';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';

export function useWalletICXBalance(account?: string | null): BigNumber {
  const { iconService } = useIconReact();
  const [balance, setBalance] = React.useState(new BigNumber(0));

  React.useEffect(() => {
    const getBalance = async () => {
      if (isEoaAddress(account)) {
        const balance = await iconService.getBalance(account).execute();
        setBalance(convertLoopToIcx(balance));
      } else {
        setBalance(new BigNumber(0));
      }
    };
    getBalance();
  }, [account, iconService]);

  return balance;
}

export function useStakedICXBalance(account?: string | null): BigNumber {
  const { iconService } = useIconReact();
  const [balance, setBalance] = React.useState(new BigNumber(0));

  React.useEffect(() => {
    const getBalance = async () => {
      if (isEoaAddress(account)) {
        const balance = await iconService.getBalance(account).execute();
        setBalance(convertLoopToIcx(balance));
      } else {
        setBalance(new BigNumber(0));
      }
    };
    getBalance();
  }, [account, iconService]);

  return balance;
}
