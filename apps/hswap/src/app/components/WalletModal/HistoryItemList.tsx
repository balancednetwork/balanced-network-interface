import React, { useMemo } from 'react';

import { XTransaction, useXTransactionStore } from '@balancednetwork/xwagmi';

import { Separator } from '@/components/ui/separator';
import { useSignedInWallets } from '@/hooks/useWallets';
import { MMTransaction, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import HistoryItem from './HistoryItem';
import IntentHistoryItem from './IntentHistoryItem';

const isMMTransaction = (transaction: MMTransaction | XTransaction): transaction is MMTransaction => {
  return !!(transaction as MMTransaction).orderId;
};

const HistoryItemList = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());
  const mmTransactions = useMMTransactionStore(state => state.getTransactions());
  const mergedTransactions = useMemo(
    () => [...xTransactions, ...mmTransactions].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [xTransactions, mmTransactions],
  );

  const signedWallets = useSignedInWallets();
  const filteredTransactions = useMemo(() => {
    return mergedTransactions.filter(t =>
      isMMTransaction(t)
        ? !!signedWallets.find(w => w.address.toLowerCase() === t.executor.toLowerCase())
        : !!signedWallets.find(w => w.address.toLowerCase() === t.input.account.toLowerCase()),
    );
  }, [mergedTransactions, signedWallets]);

  return (
    <>
      <div className="pb-2 flex gap-4 px-8 uppercase text-[#695682] text-[10px] font-medium leading-[14px]">
        <div className="w-[64px]">Assets</div>
        <div>Swap Info</div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredTransactions.length === 0 && <div className="text-center my-10">No items</div>}
        {filteredTransactions.length > 0 && (
          <>
            <Separator className="h-1 bg-[#ffffff59]" />
            {filteredTransactions.map(transaction =>
              isMMTransaction(transaction) ? (
                <IntentHistoryItem key={transaction.id} transaction={transaction} />
              ) : (
                <HistoryItem key={transaction.id} xTransaction={transaction} />
              ),
            )}
          </>
        )}
      </div>
    </>
  );
};

export default HistoryItemList;
