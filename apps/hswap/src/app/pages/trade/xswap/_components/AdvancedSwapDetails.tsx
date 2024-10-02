import React, { useCallback, useState } from 'react';

import { Currency, Percent, Price, Token, XToken } from '@balancednetwork/sdk-core';
import { Route } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';

import QuestionHelper from '@/app/components/QuestionHelper';
import SlippageSetting from '@/app/components/SlippageSetting';
import { Typography } from '@/app/theme';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SLIPPAGE_WARNING_THRESHOLD } from '@/constants/misc';
import { useSetSlippageTolerance, useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatPercent } from '@/utils';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import BigNumber from 'bignumber.js';

import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import TooltipContainer from '@/app/components2/TooltipContainer';
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
          <TooltipContainer tooltipText="The impact your trade has on the market price of this pool.">
            <div className="flex items-center justify-between">
              <span className="text-body text-secondary-foreground">
                <Trans>Price impact</Trans>
              </span>

              <Typography
                className={showSlippageWarning ? 'error-anim' : ''}
                color={showSlippageWarning ? 'alert' : 'text'}
              >
                {priceImpact}
              </Typography>
            </div>
          </TooltipContainer>

          <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Slippage tolerance</Trans>
              <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
            </span>
            <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex justify-between gap-2">
              <span className="text-body text-secondary-foreground">
                <Trans>Minimum to receive</Trans>
              </span>
              <span>
                {minimumToReceive
                  ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                  : `0 ${currencies[Field.OUTPUT]?.symbol}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Fee</Trans>
            </span>

            <Typography textAlign="right">
              {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
            </Typography>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Network cost</Trans>
            </span>

            <Typography textAlign="right">
              {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
            </Typography>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-body text-secondary-foreground">
              <Trans>Order routing</Trans>
            </span>

            <Typography textAlign="right" maxWidth="200px">
              {trade ? <TradeRoute route={trade.route} currencies={currencies} /> : '-'}
            </Typography>
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
}: { route: Route<Currency, Currency>; currencies: { [field in Field]?: XToken } }) {
  return (
    <div className="flex gap-2">
      {currencies[Field.INPUT] && currencies[Field.INPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} size="24px" />
      )}
      {route.path.map((token: Token, index: number) => {
        const xtoken = XToken.getXToken('0x1.icon', token);
        return <CurrencyLogoWithNetwork key={xtoken.address} currency={xtoken} size="24px" />;
      })}
      {currencies[Field.OUTPUT] && currencies[Field.OUTPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.OUTPUT]} size="24px" />
      )}
    </div>
  );
}
