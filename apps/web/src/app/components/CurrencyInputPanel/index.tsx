import React, { useCallback, useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { SelectorPopover } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import DropDown from '@/assets/icons/arrow-down.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useWidth from '@/hooks/useWidth';
import { COMMON_PERCENTS } from '@/store/swap/reducer';
import { escapeRegExp } from '@/utils';
import { DEFAULT_TOKEN_CHAIN } from '@/xwagmi/constants/xTokens';
import { getSupportedXChainForToken } from '@/xwagmi/xcall/utils';
import { XChainId } from '@balancednetwork/sdk-core';
import { Trans } from 'react-i18next';
import { HorizontalList, Option } from '../List';
import { CurrencySelectionType, SelectorType } from '../SearchModal/CurrencySearch';
import CurrencySearchModal from '../SearchModal/CurrencySearchModal';
import CrossChainOptions from '../trade/CrossChainOptions';

// const CurrencySelect = styled.button<{ bg?: string; disabled?: boolean; $active: boolean }>`
//   border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors?.[bg]}`};
//   background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors?.[bg]}`};
//   border-right: ${({ theme }) => `1px solid ${theme.colors?.divider}`};
//   display: flex;
//   align-items: center;
//   min-width: 128px;
//   height: 43px;
//   padding: 4px 15px;
//   color: #ffffff;
//   border-radius: 10px 0 0 10px;
//   transition: all 0.3s ease;
//   cursor: pointer;
//   pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

//   &:hover,
//   &:focus {
//     border: ${({ theme }) => `2px solid ${theme.colors?.primary}`};
//     border-right: ${({ theme }) => `1px solid ${theme.colors?.primary}`};
//   }

//   ${({ $active }) => $active && 'border-bottom-left-radius: 0;'}
// `;

const StyledTokenName = styled.span`
  line-height: 1.5;
  margin-right: auto;
  font-size: 14px;
  font-weight: bold;
`;

// const NumberInput = styled.input<{ bg?: string; $active?: boolean }>`
//   flex: 1;
//   width: 100%;
//   height: 43px;
//   text-align: right;
//   border-radius: 0 10px 10px 0;
//   border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors?.[bg]}`};
//   background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors?.[bg]}`};
//   color: #ffffff;
//   padding: 7px 15px;
//   outline: none;
//   transition: all 0.3s ease;
//   overflow: visible;
//   font-family: inherit;
//   font-size: 100%;
//   line-height: 1.15;
//   margin: 0;

//   &:hover,
//   &:focus {
//     border: 2px solid #2ca9b7;
//   }

//   ${({ $active }) => $active && 'border-bottom-right-radius: 0;'}
// `;

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  width: 10px;
`;

const ItemList = styled(Option)<{ selected: boolean }>`
  ${props => props.selected && ' background-color: #2ca9b7;'}
`;

interface CurrencyInputPanelProps {
  label?: string;
  value: string;
  onUserInput: (value: string) => void;
  onCurrencySelect?: (currency: Currency) => void;
  currency?: Currency | null;
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
  label,
  value,
  onUserInput,
  onCurrencySelect,
  currency,
  onPercentSelect,
  percent,
  currencySelectionType,
  bg = 'bg2',
  placeholder = '0',
  className,
  account,
  showCommunityListControl = true,
  selectorType,

  // cross chain stuff
  xChainId = '0x1.icon',
  onChainSelect,
  showCrossChainOptions = false,
  showCrossChainBreakdown = true,
  addressEditable = false,
  setManualAddress,
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

  const [xChainOptionsOpen, setXChainOptionsOpen] = React.useState(false);
  const xChains = useMemo(
    () =>
      currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE ||
      currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE
        ? []
        : getSupportedXChainForToken(currency),
    [currency, currencySelectionType],
  );

  const onCurrencySelectWithXChain = useCallback(
    (currency: Currency, setDefaultChain = true) => {
      onCurrencySelect && onCurrencySelect(currency);

      if (setDefaultChain && currency?.symbol) {
        const xChains =
          currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE ||
          currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE
            ? []
            : getSupportedXChainForToken(currency);
        const defaultXChainId = DEFAULT_TOKEN_CHAIN[currency.symbol];
        if (defaultXChainId && (xChains?.length ?? 0) > 1) {
          onChainSelect && onChainSelect(defaultXChainId);
          setTimeout(() => setXChainOptionsOpen(true), 100);
        }
      }
    },
    [onCurrencySelect, onChainSelect, currencySelectionType],
  );

  return (
    <div className="w-full bg-card p-4">
      <div className="flex items-end justify-between mb-2">
        <Typography variant="h4">
          <Trans>{label}</Trans>
        </Typography>
        <Typography as="div" className="text-foreground" hidden={!account}>
          <Trans>Wallet:</Trans>{' '}
          {/* {`${currencyBalances[Field.INPUT] ? currencyBalances[Field.INPUT]?.toFixed(4, { groupSeparator: ',' }) : 0} 
                ${currencies[Field.INPUT]?.symbol}`} */}
        </Typography>
      </div>
      <div ref={ref} className="inline-flex w-full">
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <div>
            <Button onClick={toggleOpen} disabled={!onCurrencySelect}>
              {currency ? (
                <>
                  <CurrencyLogo currency={currency} style={{ marginRight: 8 }} />
                  <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName>
                  {currency.symbol === 'BTCB' && <div style={{ marginLeft: 5, marginRight: 5 }}>(old)</div>}
                </>
              ) : (
                <StyledTokenName>Choose a token</StyledTokenName>
              )}
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Button>

            {onCurrencySelect && (
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
            )}
          </div>
        </ClickAwayListener>

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
        />

        {onPercentSelect && (
          <SelectorPopover show={isActive} anchorEl={ref.current} placement="bottom-end">
            <HorizontalList justifyContent="center" alignItems="center">
              {COMMON_PERCENTS.map(value => (
                <ItemList
                  key={value}
                  onClick={handlePercentSelect(value)}
                  selected={value === percent}
                >{`${value}%`}</ItemList>
              ))}
            </HorizontalList>
          </SelectorPopover>
        )}
      </div>

      {showCrossChainOptions && (
        <CrossChainOptions
          xChainId={xChainId}
          setXChainId={onChainSelect || (() => {})}
          isOpen={xChainOptionsOpen}
          setOpen={setXChainOptionsOpen}
          xChains={xChains}
          editable={addressEditable}
          currency={currency}
          width={width ? width + 40 : undefined}
          containerRef={ref.current}
          setManualAddress={setManualAddress}
        />
      )}
    </div>
  );
}
