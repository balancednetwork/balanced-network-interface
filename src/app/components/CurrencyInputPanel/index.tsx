import React from 'react';

import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { ReactComponent as DropDown } from 'assets/icons/arrow-down.svg';
import { Currency } from 'types';

const InputContainer = styled.div`
  display: inline-flex;
  width: 100%;
`;

const CurrencySelect = styled.button`
  border: 2px solid #0b284c;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  background-color: #0b284c;
  display: flex;
  align-items: center;
  width: 120px;
  height: 43px;
  padding: 4px 15px;
  color: #ffffff;
  border-radius: 10px 0 0 10px;
  transition: border 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;

  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;

const StyledTokenName = styled.span`
  line-height: 1.5;
  margin-right: 8px;
  font-size: 14px;
  font-weight: bold;
`;

const NumberInput = styled.input`
  flex: 1;
  width: 100%;
  height: 43px;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: 2px solid #0c2a4d;
  background-color: #0c2a4d;
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
`;

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  width: 10px;
`;

interface CurrencyInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  onMax?: () => void;
  showMaxButton: boolean;
  label?: string;
  onCurrencySelect?: (currency: Currency) => void;
  currency?: Currency | null;
  disableCurrencySelect?: boolean;
  hideBalance?: boolean;
  // pair?: Pair | null;
  hideInput?: boolean;
  otherCurrency?: Currency | null;
  id: string;
  showCommonBases?: boolean;
  customBalanceText?: string;
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  // pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
}: CurrencyInputPanelProps) {
  return (
    <InputContainer>
      <CurrencySelect>
        {currency ? <CurrencyLogo currency={currency} style={{ marginRight: 8 }} /> : null}
        {currency ? <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName> : null}
        {!disableCurrencySelect && <StyledDropDown selected={!!currency} />}
      </CurrencySelect>

      <NumberInput value={value} onChange={event => onUserInput(event.target.value)} />
    </InputContainer>
  );
}
