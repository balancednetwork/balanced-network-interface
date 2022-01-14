import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { SelectorPopover } from 'app/components/Popover';
import { ReactComponent as DropDown } from 'assets/icons/arrow-down.svg';
import useWidth from 'hooks/useWidth';
import { COMMON_PERCENTS } from 'store/swap/actions';
import { Currency } from 'types/balanced-sdk-core';
import { escapeRegExp } from 'utils';

import { HorizontalList, Option } from '../List';
import CurrencySearchModal from '../SearchModal/CurrencySearchModal';

const InputContainer = styled.div`
  display: inline-flex;
  width: 100%;
`;

const CurrencySelect = styled.button<{ bg?: string; disabled?: boolean }>`
  border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors[bg]}`};
  background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  border-right: ${({ theme }) => `1px solid ${theme.colors.divider}`};
  display: flex;
  align-items: center;
  min-width: 128px;
  height: 43px;
  padding: 4px 15px;
  color: #ffffff;
  border-radius: 10px 0 0 10px;
  transition: border 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  :hover,
  :focus {
    border: ${({ theme }) => `2px solid ${theme.colors.primary}`};
    border-right: ${({ theme }) => `1px solid ${theme.colors.primary}`};
  }
`;

const StyledTokenName = styled.span`
  line-height: 1.5;
  margin-right: auto;
  font-size: 14px;
  font-weight: bold;
`;

const NumberInput = styled.input<{ bg?: string; active?: boolean }>`
  flex: 1;
  width: 100%;
  height: 43px;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors[bg]}`};
  background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  color: #ffffff;
  padding: 7px 20px;
  outline: none;
  transition: border 0.3s ease;
  overflow: visible;
  font-family: inherit;
  font-size: 100%;
  line-height: 1.15;
  margin: 0;
  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
  ${props => props.active && 'border-bottom-right-radius: 0;'}
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
  onMax?: () => void;
  onCurrencySelect?: (currency: Currency) => void;
  currency?: Currency | null;
  onPercentSelect?: (percent: number) => void;
  percent?: number;
  hideBalance?: boolean;
  // pair?: Pair | null;
  hideInput?: boolean;
  otherCurrency?: Currency | null;
  id: string;
  showCommonBases?: boolean;
  hidebnUSD?: boolean;
  customBalanceText?: string;
  bg?: string;
  placeholder?: string;
  className?: string;
  account?: string | null;
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  onCurrencySelect,
  currency,
  onPercentSelect,
  percent,
  hideBalance = false,
  // pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  hidebnUSD = false,
  customBalanceText,
  bg = 'bg2',
  placeholder = '0',
  className,
  account,
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

  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <InputContainer ref={ref} className={className}>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div>
          <CurrencySelect onClick={toggleOpen} bg={bg} disabled={!onCurrencySelect}>
            {currency ? (
              <>
                <CurrencyLogo currency={currency} style={{ marginRight: 8 }} />
                <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName>
              </>
            ) : (
              <StyledTokenName>Select a token</StyledTokenName>
            )}
            {onCurrencySelect && <StyledDropDown selected={!!currency} />}
          </CurrencySelect>

          {onCurrencySelect && (
            <CurrencySearchModal
              account={account}
              isOpen={open}
              onDismiss={handleDismiss}
              onCurrencySelect={onCurrencySelect}
              showCommonBases={showCommonBases}
              hidebnUSD={hidebnUSD}
              showCurrencyAmount={false}
              anchorEl={ref.current}
              width={width ? width + 40 : undefined}
            />
          )}
        </div>
      </ClickAwayListener>

      <NumberInput
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
        //style
        bg={bg}
        active={onPercentSelect && isActive}
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
    </InputContainer>
  );
}
