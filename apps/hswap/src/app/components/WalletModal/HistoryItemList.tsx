import React, { useMemo } from 'react';
import { useXTransactionStore } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import HistoryItem from './HistoryItem';
import { Separator } from '@/components/ui/separator';

const HistoryItemList = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());

  return (
    <>
      <div className="pb-2 flex gap-4 px-10 uppercase text-[#695682] text-[10px] font-medium leading-[14px]">
        <div className="w-[72px]">Assets</div>
        <div>Swap Info</div>
      </div>

      <div className="flex flex-col gap-2">
        {xTransactions.length === 0 && <div className="text-center my-10">No items</div>}
        {xTransactions.length > 0 && (
          <>
            <Separator className="h-1 bg-[#ffffff59]" />
            {xTransactions.map(xTransaction => (
              <HistoryItem key={xTransaction.id} xTransaction={xTransaction} />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default HistoryItemList;
