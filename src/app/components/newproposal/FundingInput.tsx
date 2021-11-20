import React, { useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { BoxPanel } from 'app/components/newproposal/RatioInput';
import { PROPOSAL_CONFIG, CURRENCY_LIST } from 'app/containers/NewProposalPage/constant';
import { CurrencyAmount } from 'types';

export interface CurrencyValue {
  recipient: string;
  amounts: Amounts;
}
interface Amounts {
  [key: string]: {
    amount: string;
    currencyKey: string;
  };
}

interface Props {
  currencyValue: CurrencyValue;
  setCurrencyValue: (value: CurrencyValue) => void;
}

export default function FundingInput({ currencyValue, setCurrencyValue }: Props) {
  const [balanceList, setBalanceList] = useState<Array<CurrencyAmount>>([new CurrencyAmount('', new BigNumber(0))]);
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
    (amounts: Amounts) => {
      const symbolSelectedList = Object.values(amounts).map(({ currencyKey }) => currencyKey);
      const newCurrencyList = CURRENCY_LIST.filter(value => !symbolSelectedList.includes(value));
      setCurrencyList(newCurrencyList);
    },
    [setCurrencyList],
  );

  const handleInput = (itemId: number, key: 'amount' | 'currencyKey') => (value: string) => {
    const currentAmount = currencyValue.amounts[itemId];
    if (key === 'amount') {
      const maxValue = balanceList.find(item => item.currencyKey === currentAmount.currencyKey)?.amount;
      if (Number(value) > Number(maxValue)) return;
    }
    const newAmount: Amounts = {
      ...currencyValue.amounts,
      [itemId]: { ...currentAmount, [key]: value },
    };
    setCurrencyValue({
      ...currencyValue,
      amounts: newAmount,
    });
    if (key === 'currencyKey') {
      updateCurrencyList(newAmount);

      //Reset amount value when currencyKey change
      setCurrencyValue({
        ...currencyValue,
        amounts: {
          ...currencyValue.amounts,
          [itemId]: {
            ...currentAmount,
            currencyKey: value,
            amount: currentAmount.currencyKey === value ? currentAmount.amount : '',
          },
        },
      });
    }
  };

  const handleAddressInput = (value: string) => setCurrencyValue({ ...currencyValue, recipient: value });

  const balancesMap = {};
  balanceList.forEach(balance => (balancesMap[balance.currencyKey] = balance.amount));

  return (
    <BoxPanel>
      <StyledAddressInputPanel value={currencyValue.recipient} onUserInput={handleAddressInput} bg="bg5" />
      {Object.values(currencyValue.amounts).map((item, id) => (
        <StyledCurrencyInputPanel
          key={id}
          currencyList={[item.currencyKey, ...currencyList]}
          balanceList={balancesMap}
          value={item.amount}
          currency={item.currencyKey}
          id="funding-currency"
          showMaxButton={false}
          onCurrencySelect={handleInput(id, 'currencyKey')}
          onUserInput={handleInput(id, 'amount')}
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
                    currencyKey: currencyList[0],
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
