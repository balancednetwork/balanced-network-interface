import React, { useMemo } from 'react';
import { useXTransactionStore } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import HistoryItem from './HistoryItem';

const HistoryItemList = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());

  return (
    <div className="flex flex-col gap-2">
      {xTransactions.length === 0 && <div className="text-center my-10">No items</div>}
      {xTransactions.length > 0 &&
        xTransactions.map(xTransaction => <HistoryItem key={xTransaction.id} xTransaction={xTransaction} />)}
    </div>
  );
};

export default HistoryItemList;
