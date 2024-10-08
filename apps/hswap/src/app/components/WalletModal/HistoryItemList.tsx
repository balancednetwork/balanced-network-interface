import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useXTransactionStore } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import HistoryItem from './HistoryItem';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { CheckIcon, ChevronRightIcon, Loader2, XIcon } from 'lucide-react';

const HistoryItemList = () => {
  const getTransactions = useXTransactionStore(state => state.getTransactions);
  const xTransactions = useMemo(() => getTransactions(), [getTransactions]);
  const usdcOnArbitrum = allXTokens.find(xToken => xToken.symbol === 'USDC' && xToken.xChainId === '0xa4b1.arbitrum');
  const icx = allXTokens.find(xToken => xToken.symbol === 'ICX' && xToken.xChainId === '0x1.icon');

  return (
    <ScrollArea>
      <div className="flex flex-col gap-2">
        {xTransactions.map(xTransaction => (
          <HistoryItem key={xTransaction.id} xTransaction={xTransaction} />
        ))}
        {/* <div className="relative bg-[#221542] p-2 rounded-xl flex justify-between items-center gap-2">
          <div className="flex gap-4">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={usdcOnArbitrum} size="36px" />
              <ChevronRightIcon className="w-4 h-4" />
              <CurrencyLogoWithNetwork currency={icx} size="36px" />
            </div>

            <div className="flex flex-col ">
              <div className="text-primary-foreground text-body">Swap 2,000 USDC</div>
              <div className="text-primary-foreground text-body font-bold">for 15,241.2305 ICX</div>
            </div>
          </div>
          <div className="text-primary-foreground text-body ">10s</div>
          <span className="w-[32px] h-[32px] flex justify-center items-center rounded-full">
            <Loader2 className="animate-spin" />
          </span>
        </div>

        <div className="relative bg-[#221542] p-2 rounded-xl flex justify-between items-center gap-2">
          <div className="flex gap-4">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={usdcOnArbitrum} size="36px" />
              <ChevronRightIcon className="w-4 h-4" />
              <CurrencyLogoWithNetwork currency={icx} size="36px" />
            </div>

            <div className="flex flex-col">
              <div className="text-primary-foreground text-body ">Swap 2,000 USDC</div>
              <div className="text-primary-foreground text-body font-bold">for 15,241.2305 ICX</div>
            </div>
          </div>
          <div className="text-primary-foreground text-body ">100d</div>
          <span className="bg-green-500 border-2 border-background  w-[32px] h-[32px] flex justify-center items-center rounded-full">
            <CheckIcon className="text-background" />
          </span>
        </div>

        <div className="relative bg-[#221542] p-2 rounded-xl flex justify-between items-center gap-2">
          <div className="flex gap-4">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={usdcOnArbitrum} size="36px" />
              <ChevronRightIcon className="w-4 h-4" />
              <CurrencyLogoWithNetwork currency={icx} size="36px" />
            </div>

            <div className="flex flex-col ">
              <div className="text-primary-foreground text-body ">Swap 2,000 USDC</div>
              <div className="text-primary-foreground text-body font-bold">for 15,241.2305 ICX</div>
            </div>
          </div>
          <div className="text-primary-foreground text-body ">300d</div>
          <span className="bg-red-500 border-2 border-background  w-[32px] h-[32px] flex justify-center items-center rounded-full">
            <XIcon className="text-background" />
          </span>
        </div> */}
      </div>
    </ScrollArea>
  );
};

export default HistoryItemList;
