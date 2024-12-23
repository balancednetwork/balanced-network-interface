import React, { useState } from 'react';

import { Trans } from '@lingui/macro';

import { ChevronDownGradientIcon, ChevronUpGradientIcon } from '@/app/components2/Icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useDerivedMMTradeInfo, useDerivedSwapInfo } from '@/store/swap/hooks';
import { formatPercent } from '@/utils';
import TradePrice from './TradePrice';

export default function MMAdvancedSwapDetails() {
  const { trade: trade1 } = useDerivedSwapInfo();
  const { trade } = useDerivedMMTradeInfo(trade1);

  const [open, setOpen] = useState(false);

  const [showInverted, setShowInverted] = useState<boolean>(false);
  const priceImpact = formatPercent(undefined);

  const minimumToReceive = trade?.outputAmount;

  return (
    <div className="px-4">
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CollapsibleTrigger className="w-full flex items-center justify-between py-2">
          {trade && (
            <>
              <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
              <span>{open ? <ChevronUpGradientIcon /> : <ChevronDownGradientIcon />}</span>
            </>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Price impact</Trans>
              {/* <QuestionHelper text={t`The impact your trade has on the market price of this pool.`} /> */}
            </span>

            <span className={cn('text-right text-sm', 'text-white')}>{priceImpact}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Receive</Trans>
              {/* <QuestionHelper
                text={t`If the price moves so that you will receive less than 
                  ${
                    minimumToReceive
                      ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                      : `0 ${currencies[Field.OUTPUT]?.symbol}`
                  }, your transaction will revert.`}
              /> */}
            </span>
            <span className="text-sm text-white">
              {`${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Route</Trans>
              {/* <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} /> */}
            </span>

            <span className="text-sm text-white">Balanced Intent</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Swap Fee</Trans>
              {/* <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} /> */}
            </span>

            <span className="text-sm text-white">
              {trade ? trade.fee.toFixed(4) : '0'} {trade?.fee.currency.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Swap time</Trans>
              {/* <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} /> */}
            </span>

            <span className="text-sm text-white">~ 5s</span>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
