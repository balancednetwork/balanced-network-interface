import React, { useEffect, useState } from 'react';
import { XTransaction, XTransactionStatus } from '@/xwagmi/xcall/types';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { CheckIcon, ChevronRightIcon, Loader2, XIcon } from 'lucide-react';
import { getNetworkDisplayName } from '@/xwagmi/utils';
import { formatBalance } from '@/utils/formatter';
import { xMessageActions } from '@/xwagmi/xcall/zustand/useXMessageStore';

interface HistoryItemProps {
  xTransaction: XTransaction;
}

function formatElapsedTime(elapsedTime: number): string {
  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;

  const days = Math.floor(elapsedTime / secondsInDay);
  const hours = Math.floor((elapsedTime % secondsInDay) / secondsInHour);
  const minutes = Math.floor((elapsedTime % secondsInHour) / secondsInMinute);
  const seconds = elapsedTime % secondsInMinute;

  if (days > 0) {
    return `${days} days ${hours} hours`;
  } else if (hours > 0) {
    return `${hours} hours ${minutes} mins`;
  } else if (minutes > 0) {
    return `${minutes} mins ${seconds} seconds`;
  } else {
    return `${seconds} seconds`;
  }
}

const HistoryItem = ({ xTransaction }: HistoryItemProps) => {
  const { inputXToken, outputXToken, inputAmount, outputAmount } = xTransaction.attributes;

  const [elapsedTime, setElapsedTime] = useState(0);

  const primaryMessage = xMessageActions.getOf(xTransaction.id, true);
  const timestamp = primaryMessage?.createdAt;

  useEffect(() => {
    if (timestamp) {
      const updateElapsedTime = () => {
        setElapsedTime(Math.floor((Date.now() - timestamp) / 1000));
      };

      updateElapsedTime(); // Update immediately

      const interval = setInterval(
        () => {
          updateElapsedTime();
        },
        Date.now() - timestamp > 600000 ? 60000 : 1000,
      ); // 600000 ms = 10 minutes

      return () => clearInterval(interval);
    }
  }, [timestamp]);

  return (
    <>
      <div
        className="relative bg-[#221542] p-2 rounded-xl flex justify-between items-center gap-2 cursor-pointer"
        onClick={() => {
          console.log('xTransaction', xTransaction);
          window.open(
            `https://xcallscan.xyz/messages/search?value=${primaryMessage?.destinationTransactionHash || primaryMessage?.sourceTransactionHash}`,
            '_blank',
          );
        }}
      >
        <div>
          <div className="flex gap-3">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={inputXToken} size="32px" />
              <ChevronRightIcon className="w-4 h-4" />
              <CurrencyLogoWithNetwork currency={outputXToken} size="32px" />
            </div>

            <div className="flex flex-col">
              <div className="text-primary-foreground text-body">
                Swap {formatBalance(inputAmount, undefined)} {inputXToken.symbol} on{' '}
                {getNetworkDisplayName(inputXToken.xChainId)}
              </div>
              <div className="text-primary-foreground text-body">
                for {formatBalance(outputAmount, undefined)} {outputXToken.symbol} on{' '}
                {getNetworkDisplayName(outputXToken.xChainId)}
              </div>
              <div className="text-primary-foreground text-body">
                {elapsedTime ? formatElapsedTime(elapsedTime) + ' ago' : '...'}
              </div>
            </div>
          </div>
        </div>
        {xTransaction.status === XTransactionStatus.pending && (
          <div className="bg-green-500 border-2 border-background  w-[28px] h-[28px] flex justify-center items-center rounded-full">
            <CheckIcon className="text-background  w-4 h-4" />
          </div>
        )}
        {xTransaction.status === XTransactionStatus.success && (
          <div className="bg-green-500 border-2 border-background  w-[28px] h-[28px] flex justify-center items-center rounded-full">
            <CheckIcon className="text-background w-4 h-4" />
          </div>
        )}
        {xTransaction.status === XTransactionStatus.failure && (
          <div className="bg-red-500 border-2 border-background  w-[28px] h-[28px] flex justify-center items-center rounded-full">
            <XIcon className="text-background  w-4 h-4" />
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryItem;
