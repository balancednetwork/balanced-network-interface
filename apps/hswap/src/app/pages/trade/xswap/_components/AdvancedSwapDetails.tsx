import React, { useState } from 'react';

import SlippageSetting from '@/app/components/SlippageSetting';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PRICE_IMPACT_WARNING_THRESHOLD } from '@/constants/misc';
import { useSetSlippageTolerance, useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatPercent } from '@/utils';
import { Percent } from '@balancednetwork/sdk-core';
import { isIconTransaction, useXCallFee } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { ChevronDownGradientIcon, ChevronUpGradientIcon } from '@/app/components/Icons';
import { cn } from '@/lib/utils';
// import { xChainMap } from '@balancednetwork/xwagmi';
// import { useXEstimateApproveGas } from '@balancednetwork/xwagmi';
// import { useXEstimateSwapGas } from '@balancednetwork/xwagmi';
import TradePrice from './TradePrice';

export default function AdvancedSwapDetails() {
  const { trade, currencies, direction, xTransactionType } = useDerivedSwapInfo();

  const [open, setOpen] = useState(false);

  const [showInverted, setShowInverted] = useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();
  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));
  const showSlippageWarning = trade?.priceImpact.greaterThan(PRICE_IMPACT_WARNING_THRESHOLD);

  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

  // const sourceXChain = xChainMap[direction.from];
  // const approveGasEstimate = useXEstimateApproveGas(inputAmount, sourceXChain.contracts.assetManager, account);
  // const swapGasEstimate = useXEstimateSwapGas(xTransactionInput);

  // const networkCost = useMemo(() => {
  //   if (!swapGasEstimate) return;

  //   if (approveGasEstimate) {
  //     return new Fraction(swapGasEstimate + approveGasEstimate, 10 ** sourceXChain.nativeCurrency.decimals).toFixed(5);
  //   }

  //   return new Fraction(swapGasEstimate, 10 ** sourceXChain.nativeCurrency.decimals).toString();
  // }, [approveGasEstimate, swapGasEstimate, sourceXChain]);

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

            <span
              className={cn('text-right text-sm', showSlippageWarning ? 'text-warning animate-wiggle' : 'text-white')}
            >
              {priceImpact}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Max. slippage</Trans>
              {/* <QuestionHelper text={t`The maximum price movement before your transaction will revert.`} /> */}
            </span>
            <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Receive at least</Trans>
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
              {minimumToReceive
                ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                : `0 ${currencies[Field.OUTPUT]?.symbol}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
              <Trans>Swap Fee</Trans>
              {/* <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} /> */}
            </span>

            <span className="text-sm text-white">
              {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
            </span>
          </div>

          {!isIconTransaction(direction.from, direction.to) && (
            <div className="flex items-center justify-between">
              <span className="text-[#d4c5f9] text-sm font-medium flex items-center gap-1">
                <Trans>Bridge Fee</Trans>
                {/* <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} /> */}
              </span>

              <span className="text-sm text-white">{formattedXCallFee}</span>
            </div>
          )}

          {/* <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Network cost</Trans>
              <QuestionHelper text={t`Network cost is paid in ETH on the ARBITRUM network in order to transact.`} />
            </span>

            <span className="text-sm text-white">
              {networkCost ? `${networkCost} ${sourceXChain.nativeCurrency.symbol}` : '---'}
            </span>
          </div> */}

          {/* <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Order routing</Trans>
            </span>

            <div>{trade ? <TradeRoute route={trade.route} currencies={currencies} /> : '-'}</div>
          </div> */}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
