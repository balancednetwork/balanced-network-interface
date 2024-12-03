import { useIconReact } from '@/packages/icon-react';
import { useAllTransactions } from '@/store/transactions/hooks';
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

export default useClaimableICX;
