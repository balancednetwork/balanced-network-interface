import React from 'react';

import CurrencyLogoWithNetwork from '@/app/components/CurrencyLogoWithNetwork';
import { ExclamationIcon } from '@/app/components/Icons';
import { Separator } from '@/components/ui/separator';
import useElapsedTime from '@/hooks/useElapsedTime';
import { cn } from '@/lib/utils';
import { MMTransaction, MMTransactionStatus } from '@/store/transactions/useMMTransactionStore';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { getNetworkDisplayName, getTrackerLink } from '@balancednetwork/xwagmi';
import { CheckIcon, ExternalLink, Loader2Icon } from 'lucide-react';
import CancelIntent from './CancelIntent';

interface IntentHistoryItemProps {
  transaction: MMTransaction;
}

const IntentHistoryItem = ({ transaction }: IntentHistoryItemProps) => {
  const { fromAmount, toAmount } = transaction;

  const elapsedTime = useElapsedTime(transaction.createdAt);

  return (
    <>
      <div className="pt-4">
        <div className="relative px-8 rounded-xl flex justify-between items-start gap-0">
          <div className="flex gap-6 items-center">
            <div className="flex items-center">
              <CurrencyLogoWithNetwork currency={fromAmount.currency} />
              <CurrencyLogoWithNetwork currency={toAmount.currency} className="mx-[-8px]" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-[#0d0229] text-xs leading-none">
                From{' '}
                <strong>
                  {formatBalance(fromAmount.toFixed(), undefined)} {fromAmount.currency.symbol}
                </strong>{' '}
                on {getNetworkDisplayName(fromAmount.currency.xChainId)}
              </div>
              <div className="text-[#0d0229] text-xs leading-none">
                to{' '}
                <strong>
                  {formatBalance(toAmount.toFixed(), undefined)} {toAmount.currency.symbol}
                </strong>{' '}
                on {getNetworkDisplayName(toAmount.currency.xChainId)}
              </div>
            </div>
          </div>
          <a
            href={getTrackerLink(fromAmount.currency.xChainId, transaction.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[3px]"
          >
            <ExternalLink className="w-4 h-4 text-[#695682]" />
          </a>
        </div>
        <div className="mt-1 px-8 flex justify-end items-center gap-2">
          {transaction.status === MMTransactionStatus.pending && <CancelIntent transaction={transaction} />}

          <div className="text-[#0d0229] text-[10px] font-bold uppercase">
            {transaction.status === MMTransactionStatus.pending
              ? 'Swapping'
              : elapsedTime
                ? formatRelativeTime(elapsedTime)
                : '...'}
          </div>

          {transaction.status === MMTransactionStatus.pending && (
            <div className={cn('w-4 h-4 rounded-full bg-[#d4c5f9] p-[2px]')}>
              <Loader2Icon className="text-[#695682] animate-spin w-3 h-3" />
            </div>
          )}
          {transaction.status === MMTransactionStatus.success && (
            <div className={cn('w-4 h-4 rounded-full border-[#E6E0F7] border-[2px]')}>
              <div className="bg-title-gradient rounded-full w-full h-full flex justify-center items-center">
                <CheckIcon className="w-2 h-2" />
              </div>
            </div>
          )}
          {transaction.status === MMTransactionStatus.failure && (
            <div className={cn('w-4 h-4 rounded-full border-[#E6E0F7] border-[2px]')}>
              <ExclamationIcon />
            </div>
          )}
          {transaction.status === MMTransactionStatus.cancelled && (
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

export default IntentHistoryItem;
