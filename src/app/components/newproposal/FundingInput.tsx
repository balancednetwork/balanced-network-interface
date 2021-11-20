import React, { useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { BoxPanel } from 'app/components/newproposal/RatioInput';
import { PROPOSAL_CONFIG, CURRENCY_LIST } from 'app/containers/NewProposalPage/constant';
import { getTokenFromCurrencyKey } from 'types/adapter';
import { Currency } from 'types/balanced-sdk-core';

export interface CurrencyValue {
  recipient: string;
  amounts: Amount;
}
export interface Amount {
  [key: string]: {
    amount: string;
    symbol: string;
  };
}
export interface Balance {
  symbol: string;
  amount: BigNumber;
}

interface Props {
  currencyValue: CurrencyValue;
  setCurrencyValue: (value: CurrencyValue) => void;
}

export default function FundingInput({ currencyValue, setCurrencyValue }: Props) {
  const [balanceList, setBalanceList] = useState<Array<Balance>>([{ symbol: '', amount: new BigNumber(0) }]);
  const [currencyList, setCurrencyList] = useState(CURRENCY_LIST);

  useEffect(() => {
    (async () => {
      const result = await PROPOSAL_CONFIG.Funding.fetchInputData();
      setBalanceList(result);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateCurrencyList(currencyValue.amounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(currencyValue.amounts).length]);

  const updateCurrencyList = useCallback(
    (amounts: Amount) => {
      const symbolSelectedList = Object.values(amounts).map(({ symbol }) => symbol);
      const newCurrencyList = CURRENCY_LIST.filter(value => !symbolSelectedList.includes(value));
      setCurrencyList(newCurrencyList);
    },
    [setCurrencyList],
  );

  const handleAmountInput = (itemId: number) => (value: string) => {
    const maxValue = balanceList.find(item => item.symbol === currencyValue.amounts[itemId].symbol)?.amount;
    if (Number(value) > Number(maxValue)) return;

    const newAmount: Amount = {
      ...currencyValue.amounts,
      [itemId]: { ...currencyValue.amounts[itemId], amount: value },
    };
    setCurrencyValue({
      ...currencyValue,
      amounts: newAmount,
    });
  };

  const handleSymbolInput = (itemId: number) => (currency: Currency) => {
    const newAmount: Amount = {
      ...currencyValue.amounts,
      [itemId]: { ...currencyValue.amounts[itemId], symbol: currency.symbol },
    };
    const currentAmount = currencyValue.amounts[itemId];
    setCurrencyValue({
      ...currencyValue,
      amounts: newAmount,
    });

    updateCurrencyList(newAmount);

    //Reset amount value when currencyKey change
    setCurrencyValue({
      ...currencyValue,
      amounts: {
        ...currencyValue.amounts,
        [itemId]: {
          ...currentAmount,
          symbol: currency.symbol,
          amount: currentAmount.symbol === currency.symbol ? currentAmount.amount : '',
        },
      },
    });
  };

  const handleAddressInput = (value: string) => setCurrencyValue({ ...currencyValue, recipient: value });

  const balancesMap = {};
  balanceList.forEach(balance => (balancesMap[balance.symbol] = balance.amount));

  return (
    <BoxPanel>
      <StyledAddressInputPanel value={currencyValue.recipient} onUserInput={handleAddressInput} bg="bg5" />
      {Object.values(currencyValue.amounts).map((item, id) => (
        <StyledCurrencyInputPanel
          key={id}
          // currencyList={[item.symbol, ...currencyList]}
          balanceList={balancesMap}
          value={item.amount}
          currency={getTokenFromCurrencyKey(item.symbol)!}
          id="funding-currency"
          showMaxButton={false}
          onCurrencySelect={handleSymbolInput(id)}
          onUserInput={handleAmountInput(id)}
          bg="bg5"
        />
      ))}
      {Object.values(currencyValue.amounts).length < 3 && (
        <ButtonWrapper>
          <Button
            onClick={() => {
              setCurrencyValue({
                ...currencyValue,
                amounts: {
                  ...currencyValue.amounts,
                  [Object.keys(currencyValue.amounts).length]: {
                    amount: '',
                    symbol: currencyList[0],
                  },
                },
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
