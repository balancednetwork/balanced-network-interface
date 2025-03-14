import React, { useCallback, useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { SelectorPopover } from '@/app/components/Popover';
import DropDown from '@/assets/icons/arrow-down.svg';
import useWidth from '@/hooks/useWidth';
import { useRatesWithOracle } from '@/queries/reward';
import { COMMON_PERCENTS } from '@/store/swap/reducer';
import { escapeRegExp } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { DEFAULT_TOKEN_CHAIN, getSupportedXChainForSwapToken } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { isMobile } from 'react-device-detect';
import { HorizontalList, Option } from '../List';
import { CurrencySelectionType } from '../SearchModal/CurrencySearch';
import CurrencySearchModal from '../SearchModal/CurrencySearchModal';
import CrossChainOptions from '../trade/CrossChainOptions';
import DollarValue from './DollarValue';

const InputContainer = styled.div`
  display: inline-flex;
  width: 100%;
  position: relative;
`;

const CurrencySelect = styled.button<{ bg?: string; disabled?: boolean; $active: boolean; $showDollarValue: boolean }>`
  border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors[bg]}`};
  background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  border-right: ${({ theme }) => `1px solid ${theme.colors.divider}`};
  display: flex;
  align-items: center;
  min-width: 128px;
  height: ${({ $showDollarValue }) => ($showDollarValue ? '50px' : '43px')};
  padding: 4px 15px;
  color: #ffffff;
  border-radius: 10px 0 0 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover,
  &:focus {
    border: ${({ theme }) => `2px solid ${theme.colors.primary}`};
    border-right: ${({ theme }) => `1px solid ${theme.colors.primary}`};
  }

  ${({ $active }) => $active && 'border-bottom-left-radius: 0;'}
`;

const StyledTokenName = styled.span`
  line-height: 1.5;
  margin-right: auto;
  font-size: 14px;
  font-weight: bold;
`;

const NumberInput = styled.input<{ bg?: string; $active?: boolean; $showDollarValue: boolean }>`
  flex: 1;
  width: 100%;
  height: ${({ $showDollarValue }) => ($showDollarValue ? '50px' : '43px')};
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors[bg]}`};
  background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  color: #ffffff;
  padding: ${({ $showDollarValue }) => ($showDollarValue ? '1px 15px 20px' : '7px 15px')}; 
  outline: none;
  transition: all 0.3s ease;
  overflow: visible;
  font-family: inherit;
  font-size: 100%;
  line-height: normal;
  margin: 0;

  &:hover,
  &:focus {
    border: 2px solid #2ca9b7;
  }

  ${({ $active }) => $active && 'border-bottom-right-radius: 0;'}
`;

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  width: 10px;
`;

const ItemList = styled(Option)<{ selected: boolean }>`
  ${props => props.selected && ' background-color: #2ca9b7;'}
`;

interface CurrencyInputPanelProps {
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
  showCommunityListControl?: boolean;
  showDollarValue?: boolean;
  showWarning?: boolean;

  // cross chain stuff
  xChainId?: XChainId;
  onChainSelect?: (_chainId: XChainId) => void;
  showCrossChainOptions?: boolean;
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
  bg = 'bg2',
  placeholder = '0',
  className,
  showCommunityListControl = true,
  showDollarValue = true,
  showWarning = false,

  // cross chain stuff
  xChainId = '0x1.icon',
  onChainSelect,
  showCrossChainOptions = false,
  addressEditable = false,
  setManualAddress,
}: CurrencyInputPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const [ref, width] = useWidth();

  const prices = useRatesWithOracle();
  const price = useMemo(() => {
    if (prices && currency?.symbol) {
      return prices[currency.symbol];
    }
  }, [prices, currency]);

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
  const xChains = useMemo(() => getSupportedXChainForSwapToken(currency), [currency]);

  const onCurrencySelectWithXChain = useCallback(
    (currency: Currency, setDefaultChain = true) => {
      onCurrencySelect && onCurrencySelect(currency);

      if (setDefaultChain && currency?.symbol) {
        const defaultXChainId = DEFAULT_TOKEN_CHAIN[currency.symbol];
        if (defaultXChainId) {
          onChainSelect && onChainSelect(defaultXChainId);
          setTimeout(() => setXChainOptionsOpen(true), 100);
        }
      }
    },
    [onCurrencySelect, onChainSelect],
  );

  return (
    <Box width={1}>
      <InputContainer ref={ref} className={className}>
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <div>
            <CurrencySelect
              onClick={toggleOpen}
              bg={bg}
              disabled={!onCurrencySelect}
              $active={!!showCrossChainOptions}
              $showDollarValue={showDollarValue}
            >
              {currency ? (
                <>
                  <CurrencyLogo currency={currency} style={{ marginRight: 8 }} />
                  <StyledTokenName className="token-symbol-container">{formatSymbol(currency.symbol)}</StyledTokenName>
                  {currency.symbol === 'BTCB' && <div style={{ marginLeft: 5, marginRight: 5 }}>(old)</div>}
                </>
              ) : (
                <StyledTokenName>Choose a token</StyledTokenName>
              )}
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </CurrencySelect>

            {onCurrencySelect && (
              <CurrencySearchModal
                isOpen={open}
                onDismiss={handleDismiss}
                onCurrencySelect={onCurrencySelectWithXChain}
                currencySelectionType={currencySelectionType}
                anchorEl={ref.current}
                width={width ? width + (!isMobile ? 40 : 0) : undefined}
                selectedCurrency={currency}
                showCommunityListControl={showCommunityListControl}
                xChainId={xChainId}
              />
            )}
          </div>
        </ClickAwayListener>

        <NumberInput
          placeholder={placeholder}
          value={!percent ? value : price ? formatBalance(value, price.toFixed()) : value}
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
          //style
          bg={bg}
          $active={(onPercentSelect && isActive) || !!showCrossChainOptions}
          $showDollarValue={showDollarValue}
        />
        {showDollarValue && <DollarValue amount={value} price={price} showWarning={showWarning} />}

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
      </InputContainer>

      {showCrossChainOptions && (
        <CrossChainOptions
          xChainId={xChainId}
          setXChainId={onChainSelect || (() => {})}
          isOpen={xChainOptionsOpen}
          setOpen={setXChainOptionsOpen}
          xChains={currencySelectionType !== CurrencySelectionType.TRADE_MINT_QUOTE ? xChains : []}
          editable={addressEditable}
          currency={currency}
          width={width ? width + (!isMobile ? 40 : 0) : undefined}
          containerRef={ref.current}
          setManualAddress={setManualAddress}
          showAddress={currencySelectionType !== CurrencySelectionType.TRADE_MINT_QUOTE}
        />
      )}
    </Box>
  );
}
