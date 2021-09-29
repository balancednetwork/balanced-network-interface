import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { BoxPanel } from 'app/components/newproposal/RatioInput';
import { CurrencyKey } from 'types';

import { PROPOSAL_CONFIG, CURRENCY_LIST } from '../NewProposalPage/constant';

export interface CurrencyValue {
  amount: string;
  symbol: CurrencyKey;
  address: string;
}

export interface Balance {
  symbol: string;
  amount: BigNumber;
}

interface Props {
  currencyValue: { [key: number]: CurrencyValue };
  setCurrencyValue: (value: { [key: number]: CurrencyValue }) => void;
}

export default function FundingInput({ currencyValue, setCurrencyValue }: Props) {
  const [balanceList, setBalanceList] = useState<Array<Balance>>([{ symbol: '', amount: new BigNumber(0) }]);

  useEffect(() => {
    (async () => {
      const result = await PROPOSAL_CONFIG.Funding.fetchInputData();
      setBalanceList(result);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('currencyValue.symbol', CURRENCY_LIST);

  console.log('balanceList', balanceList);

  const handleInput = (itemId: string, key: keyof CurrencyValue) => (value: string | CurrencyValue) => {
    if (key === 'amount') {
      const maxValue = balanceList.find(item => item.symbol === currencyValue[itemId].symbol)?.amount;
      if (Number(value) > Number(maxValue)) return;
    }

    setCurrencyValue({
      ...currencyValue,
      [itemId]: {
        ...currencyValue[itemId],
        [key]: value,
      },
    });
  };

  return (
    <BoxPanel>
      {Object.entries(currencyValue).map(item => (
        <>
          <StyledAddressInputPanel value={item[1].address} onUserInput={handleInput(item[0], 'address')} bg="bg5" />
          <StyledCurrencyInputPanel
            currencyList={CURRENCY_LIST}
            balanceList={balanceList}
            value={item[1].amount}
            currency={item[1].symbol}
            id="funding-currency"
            showMaxButton={false}
            onCurrencySelect={handleInput(item[0], 'symbol')}
            onUserInput={handleInput(item[0], 'amount')}
            bg="bg5"
          />
        </>
      ))}
      <ButtonWrapper>
        <Button
          onClick={() => {
            setCurrencyValue({
              ...currencyValue,
              [Object.keys(currencyValue).length]: {
                amount: '',
                symbol: CURRENCY_LIST[0],
                address: '',
              },
            });
          }}
        >
          Add another asset
        </Button>
      </ButtonWrapper>
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
