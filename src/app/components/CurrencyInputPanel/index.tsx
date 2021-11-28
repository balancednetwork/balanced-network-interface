import React from 'react';

import JSBI from 'jsbi';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { List, ListItem, DashGrid, HeaderText, DataText, HorizontalList, Option } from 'app/components/List';
import { PopperWithoutArrow, SelectorPopover } from 'app/components/Popover';
import { ReactComponent as DropDown } from 'assets/icons/arrow-down.svg';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useWidth from 'hooks/useWidth';
import { COMMON_PERCENTS } from 'store/swap/actions';
import { useWalletBalances } from 'store/wallet/hooks';
import { Currency, CurrencyAmount } from 'types/balanced-sdk-core';
import { escapeRegExp } from 'utils';

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
  width: 128px;
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
  margin-right: 8px;
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
  showMaxButton: boolean;
  label?: string;
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
  customBalanceText?: string;
  bg?: string;
  placeholder?: string;
  className?: string;
  balanceList?: CurrencyAmount<Currency>[];
  currencyList?: Currency[];
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
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
  customBalanceText,
  bg = 'bg2',
  placeholder = '0',
  className,
  balanceList,
  currencyList = SUPPORTED_TOKENS_LIST,
}: CurrencyInputPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const [ref, width] = useWidth();
  //
  const handleCurrencySelect = (ccy: Currency) => (e: React.MouseEvent) => {
    onCurrencySelect && onCurrencySelect(ccy);
    setOpen(false);
  };

  const handlePercentSelect = (instant: number) => (e: React.MouseEvent) => {
    onPercentSelect && onPercentSelect(instant);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };

  const balances = useWalletBalances();

  return (
    <InputContainer ref={ref} className={className}>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <CurrencySelect onClick={toggleOpen} bg={bg} disabled={!onCurrencySelect}>
          {currency && <CurrencyLogo currency={currency} style={{ marginRight: 8 }} />}
          {currency ? <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName> : null}
          {onCurrencySelect && <StyledDropDown selected={!!currency} />}

          {onCurrencySelect && (
            <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom" offset={[0, 2]}>
              <List style={{ width: width }}>
                <DashGrid>
                  <HeaderText>Asset</HeaderText>
                  <HeaderText textAlign="right">{balanceList ? 'Balance' : 'Wallet'}</HeaderText>
                </DashGrid>
                {currencyList.map(ccy => (
                  <ListItem key={ccy.symbol} onClick={handleCurrencySelect(ccy)}>
                    <Flex>
                      <CurrencyLogo currency={ccy} style={{ marginRight: '8px' }} />
                      <DataText variant="p" fontWeight="bold">
                        {ccy?.symbol}
                      </DataText>
                    </Flex>
                    <DataText variant="p" textAlign="right">
                      {balanceList
                        ? JSBI.toNumber(
                            balanceList.find(item => item.currency.symbol === ccy?.symbol!)?.numerator ||
                              JSBI.BigInt(0),
                          )
                        : balances[ccy?.symbol!]?.dp(2).toFormat()}
                    </DataText>
                  </ListItem>
                ))}
              </List>
            </PopperWithoutArrow>
          )}
        </CurrencySelect>
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
