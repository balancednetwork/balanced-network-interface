import React, { useCallback, useState } from 'react';

import { Currency, Percent, Price, Token, XToken } from '@balancednetwork/sdk-core';
import { Route } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';

import QuestionHelper from '@/app/components/QuestionHelper';
import SlippageSetting from '@/app/components/SlippageSetting';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SLIPPAGE_WARNING_THRESHOLD } from '@/constants/misc';
import { useSetSlippageTolerance, useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatPercent } from '@/utils';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import BigNumber from 'bignumber.js';

import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

export default function AdvancedSwapDetails() {
  const [open, setOpen] = useState(false);

  const { trade, currencies, direction } = useDerivedSwapInfo();

  const [showInverted, setShowInverted] = useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();
  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));
  const showSlippageWarning = trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

  return (
    <div>
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CollapsibleTrigger className="w-full flex items-center justify-between py-2">
          {trade && (
            <>
              <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
              <span>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Price impact</Trans>
              <QuestionHelper text={t`The impact your trade has on the market price of this pool.`} />
            </span>

            <span className={cn(showSlippageWarning ? 'text-warning animate-wiggle' : 'text-primary-foreground')}>
              {priceImpact}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Slippage tolerance</Trans>
              <QuestionHelper text={t`The maximum price movement before your transaction will revert.`} />
            </span>
            <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Receive at least</Trans>
              <QuestionHelper
                text={t`If the price moves so that you will receive less than 
                  ${
                    minimumToReceive
                      ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                      : `0 ${currencies[Field.OUTPUT]?.symbol}`
                  }, your transaction will revert.`}
              />
            </span>
            <span className="text-body text-primary-foreground">
              {minimumToReceive
                ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                : `0 ${currencies[Field.OUTPUT]?.symbol}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Fee</Trans>
              <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
            </span>

            <span className="text-body">
              {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-foreground flex items-center gap-1">
              <Trans>Network cost</Trans>
              <QuestionHelper text={t`Network cost is paid in ETH on the ARBITRUM network in order to transact.`} />
            </span>

            <span className="text-body text-primary-foreground">
              {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Order routing</Trans>
            </span>

            <div>{trade ? <TradeRoute route={trade.route} currencies={currencies} /> : '-'}</div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface TradePriceProps {
  price: Price<Currency, Currency>;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `;
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`;
  const flipPrice: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      e.stopPropagation();
      setShowInverted(!showInverted);
    },
    [setShowInverted, showInverted],
  );

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`;

  return (
    <div onClick={flipPrice} title={text}>
      <div className="text-body">{text}</div>
    </div>
  );
}

export function TradeRoute({
  route,
  currencies,
}: {
  route: Route<Currency, Currency>;
  currencies: { [field in Field]?: XToken };
}) {
  return (
    <div className="flex gap-2">
      {currencies[Field.INPUT] && currencies[Field.INPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} size="32px" />
      )}
      {route.path.map((token: Token, index: number) => {
        const xtoken = XToken.getXToken('0x1.icon', token);
        return <CurrencyLogoWithNetwork key={xtoken.address} currency={xtoken} size="32px" />;
      })}
      {currencies[Field.OUTPUT] && currencies[Field.OUTPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.OUTPUT]} size="32px" />
      )}
    </div>
  );
}
