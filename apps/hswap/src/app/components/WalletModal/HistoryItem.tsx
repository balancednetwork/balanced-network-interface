import React from 'react';

import CurrencyLogoWithNetwork from '@/app/components/CurrencyLogoWithNetwork';
import { ExclamationIcon } from '@/app/components/Icons';
import { Separator } from '@/components/ui/separator';
import useElapsedTime from '@/hooks/useElapsedTime';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { getNetworkDisplayName, getTrackerLink, isIconTransaction } from '@balancednetwork/xwagmi';
import { XTransaction, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xMessageActions } from '@balancednetwork/xwagmi';
import { CheckIcon, ExternalLink, Loader2Icon } from 'lucide-react';

interface HistoryItemProps {
  xTransaction: XTransaction;
}

const HistoryItem = ({ xTransaction }: HistoryItemProps) => {
  const inputXToken = xTransaction.input.inputAmount.currency;
  const outputXToken = xTransaction.input?.outputAmount!.currency;
  const inputAmount = xTransaction.input.inputAmount.toFixed();
  const outputAmount = xTransaction.input?.outputAmount!.toFixed();
  const primaryMessage = xMessageActions.getOf(xTransaction.id, true);

  const elapsedTime = useElapsedTime(xTransaction.createdAt);

  return (
    <>
      <div className="pt-4">
        <div className="relative px-8 rounded-xl flex justify-between items-start gap-0">
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
              isIconTransaction(xTransaction.sourceChainId, xTransaction.finalDestinationChainId)
                ? getTrackerLink('0x1.icon', xTransaction.id.split('/')[1])
                : `https://xcallscan.xyz/messages/search?value=${primaryMessage?.destinationTransactionHash || primaryMessage?.sourceTransactionHash}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[3px]"
          >
            <ExternalLink className="w-4 h-4 text-[#695682]" />
          </a>
        </div>
        <div className="mt-1 px-8 flex justify-end items-center gap-2">
          <div className="text-[#0d0229] text-[10px] font-bold uppercase">
            {xTransaction.status === XTransactionStatus.pending
              ? 'Swapping'
              : elapsedTime
                ? formatRelativeTime(elapsedTime)
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
