import React, { useCallback, useEffect, useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { useIconReact } from 'packages/icon-react';
import styled from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { BoxPanel } from 'app/components/newproposal/RatioInput';
import { parseUnits } from 'utils';

import { CurrencySelectionType } from '../SearchModal/CurrencySearch';

type Amount = {
  item: CurrencyAmount<Currency>;
  inputDisplayValue?: string;
};
export interface CurrencyValue {
  recipient: string;
  amounts: Amount[];
}

interface Props {
  currencyValue: CurrencyValue;
  setCurrencyValue: (value: CurrencyValue) => void;
  balanceList: CurrencyAmount<Currency>[];
}

export default function FundingInput({ currencyValue, setCurrencyValue, balanceList }: Props) {
  const [currencyList, setCurrencyList] = useState<Currency[]>([]);

  useEffect(() => {
    setCurrencyList(balanceList.map(balance => balance.currency));
  }, [balanceList]);

  useEffect(() => {
    updateCurrencyList(currencyValue.amounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(currencyValue.amounts).length]);

  const updateCurrencyList = useCallback(
    (amounts: Amount[]) => {
      const symbolSelectedList = amounts.map(amount => amount.item.currency.symbol);
      const newCurrencyList = balanceList
        .filter(({ currency }) => !symbolSelectedList.includes(currency.symbol))
        .map(balance => balance.currency);
      setCurrencyList(newCurrencyList);
    },
    [balanceList],
  );

  const handleAmountInput = (itemId: number) => (value: string) => {
    const maxValue = balanceList
      .find(item => item?.currency.symbol === currencyValue.amounts[itemId].item.currency.symbol)
      ?.toFixed(2);
    if (maxValue && Number(value) > Number(maxValue)) return;

    const newAmount = currencyValue.amounts;
    newAmount[itemId].item = CurrencyAmount.fromRawAmount(
      newAmount[itemId].item.currency,
      parseUnits(value || '0', newAmount[itemId].item.currency.decimals),
    );
    newAmount[itemId].inputDisplayValue = value;

    setCurrencyValue({
      ...currencyValue,
      amounts: newAmount,
    });
  };

  const handleSymbolInput = (itemId: number) => (currency: Currency) => {
    const newAmount = currencyValue.amounts;
    currencyValue.amounts[itemId].item = CurrencyAmount.fromRawAmount(currency, 0);
    newAmount[itemId].inputDisplayValue = '';
    setCurrencyValue({
      ...currencyValue,
      amounts: newAmount,
    });

    updateCurrencyList(newAmount);
  };

  const handleAddressInput = (value: string) => setCurrencyValue({ ...currencyValue, recipient: value });

  const { networkId } = useIconReact();
  return (
    <BoxPanel>
      <StyledAddressInputPanel value={currencyValue.recipient} onUserInput={handleAddressInput} bg="bg5" />
      {currencyValue.amounts.map((item, id) => (
        <StyledCurrencyInputPanel
          account={addresses[networkId].daofund}
          key={id}
          value={item.inputDisplayValue || ''}
          currency={item.item.currency}
          onCurrencySelect={handleSymbolInput(id)}
          onUserInput={handleAmountInput(id)}
          bg="bg5"
          currencySelectionType={CurrencySelectionType.VOTE_FUNDING}
        />
      ))}
      {Object.values(currencyValue.amounts).length < balanceList.length && (
        <ButtonWrapper>
          <Button
            onClick={() => {
              setCurrencyValue({
                ...currencyValue,
                amounts: [...currencyValue.amounts, { item: CurrencyAmount.fromRawAmount(currencyList[0], 0) }],
              });
            }}
          >
            Add another asset
          </Button>
        </ButtonWrapper>
      )}
    </BoxPanel>
  );
}
const StyledAddressInputPanel = styled(AddressInputPanel)`
  & > button {
    width: 128px;
  }
  margin-top: 25px;
`;
const StyledCurrencyInputPanel = styled(CurrencyInputPanel)`
  margin-top: 15px;
`;

const ButtonWrapper = styled.div`
  text-align: center;
  margin: 15px auto 3px;
`;

const Button = styled.button`
  color: #2fccdc;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  &:after {
    content: '';
    display: block;
    width: 0px;
    height: 1px;
    margin-top: 3px;
    background: transparent;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  &:hover:after {
    width: 100%;
    background: #2fccdc;
  }
`;
