import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useXTransactionStore } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import HistoryItem from './HistoryItem';

const HistoryItemList = () => {
  const getTransactions = useXTransactionStore(state => state.getTransactions);
  const xTransactions = useMemo(() => getTransactions(), [getTransactions]);

  return (
    <ScrollArea>
      <div className="flex flex-col gap-2">
        {xTransactions.length === 0 && <div className="text-center my-10">No items</div>}
        {xTransactions.length > 0 &&
          xTransactions.map(xTransaction => <HistoryItem key={xTransaction.id} xTransaction={xTransaction} />)}
      </div>
    </ScrollArea>
  );
};

export default HistoryItemList;
