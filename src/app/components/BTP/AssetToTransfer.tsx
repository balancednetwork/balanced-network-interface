import React, { useState } from 'react';

import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { inputRegex } from 'app/components/CurrencyInputPanel';
import { UnderlineText } from 'app/components/DropdownText';
import { escapeRegExp } from 'utils';

import { Label } from './NetworkSelector';

const WalletAmount = styled(UnderlineText)`
  ${({ theme }) =>
    css`
      color: ${theme.colors.primaryBright};
    `};
`;

export const AssetInfo = styled(Flex)`
  border-radius: 10px;

  ${({ theme }) =>
    css`
      background-color: ${theme.colors.bg5};
    `};
`;

export const AssetName = styled(Flex)`
  font-weight: 700;
  color: #fff;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  align-items: center;
  padding: 3px 20px;
  font-size: 14px;
`;

export const AssetInput = styled.input`
  flex: 1;
  flex-grow: 1;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: ${({ theme }) => `2px solid ${theme.colors.bg5}`};
  background-color: ${({ theme }) => `${theme.colors.bg5}`};
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

const AssetToTransfer = () => {
  const [inputAmount, setInputAmount] = useState('');

  const onUserInput = (input: string) => {
    setInputAmount(input);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };

  return (
    <>
      <Flex justifyContent={'space-between'}>
        <Label>Asset to transfer</Label>
        <Label>
          Wallet: <WalletAmount color={'red'}>{`${0} tokens`}</WalletAmount>
        </Label>
      </Flex>
      <AssetInfo>
        <AssetName>GLMR</AssetName>
        <AssetInput
          placeholder="0"
          value={inputAmount}
          // onClick={() => setIsActive(!isActive)}
          // onBlur={() => setIsActive(false)}
          onChange={event => {
            enforcer(event.target.value.replace(/,/g, '.'));
          }}
          inputMode="decimal"
          title="Token Amount"
          autoComplete="off"
          autoCorrect="off"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        ></AssetInput>
      </AssetInfo>
    </>
  );
};

export default AssetToTransfer;
