import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { PopperWithoutArrow } from 'app/components/Popover';
import { ReactComponent as DropDown } from 'assets/icons/arrow-down.svg';
import { CURRENCYLIST } from 'constants/currency';
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
  width: 128px;
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

const CurrencySelection = styled.div`
  display: flex;
  flex-direction: column;
  top: 50px;
  max-height: 540px;
  overflow: auto;
  left: 0;
  padding: 20px;
  padding-bottom: 0;
  background: ${({ theme }) => theme.colors.bg2};
  border-bottom-right-radius: 12px;
  border-bottom-left-radius: 12px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.04);
`;

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
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  //
  const handleCurrencySelect = (ccy: Currency) => (e: React.MouseEvent) => {
    onCurrencySelect && onCurrencySelect(ccy);
    setOpen(false);
  };

  return (
    <InputContainer ref={ref}>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <CurrencySelect onClick={toggleOpen}>
          {currency ? <CurrencyLogo currency={currency} style={{ marginRight: 8 }} /> : null}
          {currency ? <StyledTokenName className="token-symbol-container">{currency.symbol}</StyledTokenName> : null}
          {!disableCurrencySelect && <StyledDropDown selected={!!currency} />}

          {onCurrencySelect && (
            <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom">
              <CurrencySelection style={{ width: width }}>
                <table className="list assets">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(CURRENCYLIST).map(item => (
                      <tr onClick={handleCurrencySelect(item)} key={item.name}>
                        <td>
                          <CurrencyLogo currency={item} style={{ marginRight: 8 }} />
                          {item.symbol}
                        </td>
                        <td>6,808</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CurrencySelection>
            </PopperWithoutArrow>
          )}
        </CurrencySelect>
      </ClickAwayListener>

      <NumberInput value={value} onChange={event => onUserInput(event.target.value)} />
    </InputContainer>
  );
}
