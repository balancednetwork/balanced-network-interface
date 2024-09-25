import React, { useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useWidth from '@/hooks/useWidth';
import { escapeRegExp } from '@/utils';
import { XToken } from '@balancednetwork/sdk-core';
import { XChainId } from '@balancednetwork/sdk-core';
import { CurrencySelectionType, SelectorType } from '../../components/SearchModal/CurrencySearch';
import { TokenSelectModal } from '../TokenSelectModal';

// const StyledTokenName = styled.span`
//   line-height: 1.5;
//   margin-right: auto;
//   font-size: 14px;
//   font-weight: bold;
// `;

// const ItemList = styled(Option)<{ selected: boolean }>`
//   ${props => props.selected && ' background-color: #2ca9b7;'}
// `;

interface CurrencyInputPanelProps {
  label?: string;
  value: string;
  onUserInput: (value: string) => void;
  onCurrencySelect?: (currency: XToken) => void;
  currency?: XToken | null;
  onPercentSelect?: (percent: number) => void;
  percent?: number;
  currencySelectionType?: CurrencySelectionType;
  bg?: string;
  placeholder?: string;
  className?: string;
  account?: string | null;
  showCommunityListControl?: boolean;
  selectorType?: SelectorType;

  // cross chain stuff
  xChainId?: XChainId;
  onChainSelect?: (_chainId: XChainId) => void;
  showCrossChainOptions?: boolean;
  showCrossChainBreakdown?: boolean;
  addressEditable?: boolean;
  setManualAddress?: (xChainId: XChainId, address?: string | undefined) => void;
}

export const inputRegex = /^\d*(?:\\[.])?\d*$/; // match escaped "." characters via in a non-capturing group

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onCurrencySelect,
  currency,
  onPercentSelect,
  percent,
  currencySelectionType,
  placeholder = '0',
  className,
  account,
  showCommunityListControl = true,
  selectorType,

  // cross chain stuff
  xChainId = '0x1.icon',
  onChainSelect,
  showCrossChainBreakdown = true,
}: CurrencyInputPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const [ref, width] = useWidth();

  const handlePercentSelect = (instant: number) => (e: React.MouseEvent) => {
    onPercentSelect && onPercentSelect(instant);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const onCurrencySelectWithXChain = useCallback(
    (currency: XToken) => {
      onCurrencySelect && onCurrencySelect(currency);
    },
    [onCurrencySelect],
  );

  return (
    <div className="rounded-xl w-full bg-card p-4 flex flex-col gap-2">
      <span className="text-secondary-foreground text-subtitle">You pay</span>
      <div ref={ref} className="inline-flex w-full">
        <Input
          placeholder={placeholder}
          value={value}
          onClick={() => setIsActive(!isActive)}
          onBlur={() => setIsActive(false)}
          onChange={event => {
            enforcer(event.target.value.replace(/,/g, '.'));
          }}
          // universal input options
          inputMode="decimal"
          title="Token Amount"
          autoComplete="off"
          autoCorrect="off"
          // text-specific options
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength={1}
          maxLength={79}
          spellCheck="false"
          className="p-0 text-title text-xl bg-transparent border-none focus:border-none text-primary-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div>
          <Button onClick={toggleOpen} disabled={!onCurrencySelect} className="bg-background">
            ETH
            {/* <CurrencyLogo currency={currency} style={{ marginRight: 8 }} /> */}
            {/* <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName> */}
            {/* {currency.symbol === 'BTCB' && <div style={{ marginLeft: 5, marginRight: 5 }}>(old)</div>} */}
          </Button>

          {/* {onCurrencySelect && (
            <CurrencySearchModal
              account={account}
              isOpen={open}
              onDismiss={handleDismiss}
              onCurrencySelect={onCurrencySelectWithXChain}
              onChainSelect={onChainSelect}
              currencySelectionType={currencySelectionType}
              showCurrencyAmount={false}
              anchorEl={ref.current}
              width={width ? width + 40 : undefined}
              selectedCurrency={currency}
              showCommunityListControl={showCommunityListControl}
              xChainId={xChainId}
              showCrossChainBreakdown={showCrossChainBreakdown}
              selectorType={selectorType}
            />
          )} */}
        </div>
      </div>
      <div className="flex justify-between">
        <span className="text-secondary-foreground text-smallbody">$2,000</span>
        <span className="text-secondary-foreground text-smallbody">2,000 USDC</span>
      </div>
      <TokenSelectModal open={open} setOpen={setOpen} account={account} />
    </div>
  );
}
