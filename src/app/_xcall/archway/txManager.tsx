import React from 'react';

import { openToast } from 'btp/src/connectors/transactionToast';

import { TransactionStatus } from 'store/transactions/hooks';

type ArchTransactionType = {
  transactionHash: string;
};

interface ArchwayTxManager {
  transactions: ArchTransactionType[];
  isTxPending: boolean;
  setTxPending: React.Dispatch<React.SetStateAction<boolean>>;
  initTransaction: (msg: string) => void;
  addTransactionResult: (tx: ArchTransactionType | null, msg: string) => void;
}

export function useArchwayTxManager(): ArchwayTxManager {
  const [transactions, setTransactions] = React.useState<ArchTransactionType[]>([]);
  const [isTxPending, setTxPending] = React.useState<boolean>(false);

  const getToastId = React.useCallback((): string => {
    return `archway-tx-${transactions.length.toString()}`;
  }, [transactions.length]);

  return React.useMemo(() => {
    const initTransaction = (msg: string) => {
      setTxPending(true);
      openToast({
        message: msg,
        transactionStatus: TransactionStatus.pending,
        options: {},
        id: getToastId(),
      });
    };

    const addTransactionResult = (tx: ArchTransactionType | null, msg: string) => {
      openToast({
        message: msg,
        transactionStatus: tx ? TransactionStatus.success : TransactionStatus.failure,
        options: {},
        id: getToastId(),
      });
      setTxPending(false);
      tx && setTransactions([...transactions, tx]);
    };

    return {
      transactions,
      isTxPending,
      setTxPending,
      initTransaction,
      addTransactionResult,
    };
  }, [transactions, isTxPending, getToastId]);
}
