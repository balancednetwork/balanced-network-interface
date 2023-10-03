import React from 'react';

import { t } from '@lingui/macro';

import { ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';

import { useArchwayContext } from '../ArchwayProvider';
import { ARCHWAY_CONTRACTS } from '../config';

const useAllowanceHandler = (
  tokenAddress: string,
  amountNeeded: string,
  spenderAddress: string = ARCHWAY_CONTRACTS.assetManager,
) => {
  const { address, signingClient } = useArchwayContext();
  const addTransactionResult = useAddTransactionResult();
  const initTransaction = useInitTransaction();
  const { transactions } = useArchwayTransactionsState();
  const [allowance, setAllowance] = React.useState<string>('0');
  const [allowanceIncreased, setAllowanceIncreased] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (tokenAddress && signingClient) {
      signingClient
        .queryContractSmart(tokenAddress, {
          allowance: { owner: address, spender: spenderAddress },
        })
        .then(res => {
          setAllowance(res.allowance);
        });
    }
  }, [address, signingClient, spenderAddress, tokenAddress, transactions.length]);

  React.useEffect(() => {
    if (Number(allowance) < Number(amountNeeded)) {
      setAllowanceIncreased(false);
    }
  }, [allowance, amountNeeded]);

  const isIncreaseNeeded = React.useMemo(() => {
    return tokenAddress !== ARCHWAY_CONTRACTS.bnusd && Number(allowance) < Number(amountNeeded);
  }, [tokenAddress, allowance, amountNeeded]);

  const actualIncreaseNeeded = React.useMemo(() => {
    return (Number(amountNeeded) - Number(allowance)).toString();
  }, [allowance, amountNeeded]);

  const increaseAllowance = async () => {
    if (signingClient && address && tokenAddress) {
      const msg = {
        increase_allowance: {
          spender: spenderAddress,
          amount: actualIncreaseNeeded,
        },
      };
      try {
        initTransaction(
          'archway',
          t`Increasing allowance for ${ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS[tokenAddress].symbol}...`,
        );
        const res = await signingClient.execute(address, tokenAddress, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '200000',
        });
        setAllowanceIncreased(true);
        addTransactionResult('archway', res, t`Allowance successfully increased.`);
        console.log('xCall debug - increase allowance: ', res);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!tokenAddress || amountNeeded === '0') {
    return {
      allowance: '0',
      isIncreaseNeeded: false,
      increaseAllowance: () => {},
    };
  }

  return {
    allowance,
    allowanceIncreased,
    isIncreaseNeeded,
    increaseAllowance,
  };
};

export default useAllowanceHandler;
