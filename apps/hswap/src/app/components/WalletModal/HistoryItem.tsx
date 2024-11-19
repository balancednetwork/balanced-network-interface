import React, { useEffect, useState } from 'react';
import { XTransaction, XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { CheckIcon, ExternalLink, Loader2Icon, XIcon } from 'lucide-react';
import { getNetworkDisplayName } from '@/xwagmi/utils';
import { formatBalance } from '@/utils/formatter';
import { xMessageActions } from '@/xwagmi/xcall/zustand/useXMessageStore';
import { getTrackerLink } from '@/hooks/useTransactionStore';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ExclamationIcon } from '@/app/components2/Icons';

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
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hours ago`;
  } else if (minutes > 0) {
    return `${minutes} mins ago`;
  } else {
    return `just now`;
  }
}

const HistoryItem = ({ xTransaction }: HistoryItemProps) => {
  const { inputXToken, outputXToken, inputAmount, outputAmount } = xTransaction.attributes;

  const primaryMessage = xMessageActions.getOf(xTransaction.id, true);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timestamp = xTransaction.createdAt;
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
      <div className="py-2">
        <div className="relative px-10 rounded-xl flex justify-between items-center gap-2 cursor-pointer">
          <div className="flex gap-6 items-center">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={inputXToken} />
              <CurrencyLogoWithNetwork currency={outputXToken} className="mx-[-8px]" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-[#0d0229] text-xs leading-none">
                From{' '}
                <strong>
                  {formatBalance(inputAmount, undefined)} {inputXToken.symbol}
                </strong>{' '}
                on {getNetworkDisplayName(inputXToken.xChainId)}
              </div>
              <div className="text-[#0d0229] text-xs leading-none">
                to{' '}
                <strong>
                  {formatBalance(outputAmount, undefined)} {outputXToken.symbol}
                </strong>{' '}
                on {getNetworkDisplayName(outputXToken.xChainId)}
              </div>
            </div>
          </div>
          <a
            href={
              xTransaction.type === XTransactionType.SWAP_ON_ICON
                ? getTrackerLink('0x1.icon', xTransaction.id.split('/')[1])
                : `https://xcallscan.xyz/messages/search?value=${primaryMessage?.destinationTransactionHash || primaryMessage?.sourceTransactionHash}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4 text-[#695682]" />
          </a>
        </div>
        <div className="mt-1 px-10 flex justify-end items-center gap-2">
          <div className="text-[#0d0229] text-[10px] font-bold uppercase">
            {xTransaction.status === XTransactionStatus.pending
              ? 'Swapping'
              : elapsedTime
                ? formatElapsedTime(elapsedTime)
                : '...'}
          </div>

          {xTransaction.status === XTransactionStatus.pending && (
            <div className={cn('w-4 h-4 rounded-full bg-[#d4c5f9] p-[2px]')}>
              <Loader2Icon className="text-[#695682] animate-spin w-3 h-3" />
            </div>
          )}
          {xTransaction.status === XTransactionStatus.success && (
            <div className={cn('w-4 h-4 rounded-full border-[#E6E0F7] border-[2px]')}>
              <div className="bg-title-gradient rounded-full w-full h-full flex justify-center items-center">
                <CheckIcon className="w-2 h-2" />
              </div>
            </div>
          )}
          {xTransaction.status === XTransactionStatus.failure && (
            <div className={cn('w-4 h-4 rounded-full border-[#E6E0F7] border-[2px]')}>
              <ExclamationIcon />
            </div>
          )}
        </div>
      </div>
      <Separator className="h-1 bg-[#ffffff59]" />
    </>
  );
};

export default HistoryItem;
