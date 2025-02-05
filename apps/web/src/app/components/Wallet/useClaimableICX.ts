import { useIconReact } from '@/packages/icon-react';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useICONWalletBalances, useXBalancesByToken } from '@/store/wallet/hooks';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { bnJs } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

function useClaimableICX() {
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const { account } = useIconReact();
  const transactions = useAllTransactions();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  return claimableICX;
}

//tmp
export const useHasBTCB = () => {
  const balances = useICONWalletBalances();
  const BTCB = Object.values(balances).find(balance => balance.currency.symbol === 'BTCB');
  return BTCB?.greaterThan(0);
};
//end of tmp

export default useClaimableICX;
