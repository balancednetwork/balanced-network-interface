import useKeyPress from '@/hooks/useKeyPress';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@/xwagmi/types';
import { validateAddress } from '@/xwagmi/utils';
import React from 'react';
import { Flex } from 'rebass';
import styled from 'styled-components';
import Warning from '../Warning';

const InputWrap = styled(Flex)`

  input {
    background: transparent;
    color: #FFF;
    outline: none;
    border: none;
    padding-left: 15px;
    padding-right: 15px;
    object-fit: fill;
    border-radius: 10px 0 0 10px;
    border: 2px solid ${({ theme }) => theme.colors.bg5};
    background-color: ${({ theme }) => theme.colors.bg5};
    height: 45px;
    border-right: 0;
    flex-grow: 1;
    transition: all 0.2s ease;
    min-width: 180px;
    font-size: 14px;

    &.invalid, &.empty {
      border-radius: 10px;
      border-right: 2px solid ${({ theme }) => theme.colors.bg5};
    }

    &.valid {
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &.invalid {
      border-color: ${({ theme }) => theme.colors.alert} !important;
    }
  }

  input:focus, input:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  button {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary};
    border-left: 0;
    color: #FFF;
    font-size: 16px;
    appearance: none;
    outline: 0;
    border-radius: 0 10px 10px 0;
    height: 45px;
    padding: 5px 13px 5px 15px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
    max-width: 50%;
    white-space: nowrap;
    opacity: 1;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryBright};
      border-color: ${({ theme }) => theme.colors.primaryBright};
    }
    
    &[disabled] {
      max-width: 0;
      padding-left: 0;
      padding-right: 0;
      opacity: 0;
    }
  }
`;

const AddressInput = ({
  onSave,
  xChainId,
  setManualAddress,
}: {
  onSave?: () => void;
  xChainId: XChainId;
  setManualAddress?: (xChainId: XChainId, address?: string | undefined) => void;
}) => {
  const { onChangeRecipient } = useSwapActionHandlers();
  const { direction } = useDerivedSwapInfo();
  const { recipient } = useSwapState();
  const [value, setValue] = React.useState(recipient || '');
  const [isValid, setValid] = React.useState(false);
  const enter = useKeyPress('Enter');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  React.useEffect(() => {
    setValid(validateAddress(value, xChainId));
  }, [value, xChainId]);

  React.useEffect(() => {
    setValue(recipient || '');
  }, [recipient]);

  const handleClick = React.useCallback(() => {
    setManualAddress && setManualAddress(xChainId, value);
    onChangeRecipient(value);
    onSave?.();
  }, [setManualAddress, xChainId, value, onChangeRecipient, onSave]);

  React.useEffect(() => {
    if (enter && isValid) {
      handleClick();
    }
  }, [isValid, enter, handleClick]);

  return (
    <>
      <InputWrap>
        <input
          type="text"
          placeholder={`${xChainMap[direction.to].name} address`}
          value={value}
          onChange={handleChange}
          className={value.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'}
          autoComplete="off"
          spellCheck="false"
          aria-label="Enter recipient address"
        />
        <button disabled={!isValid} type="button" onClick={handleClick} aria-label="Use entered address">
          Use
        </button>
      </InputWrap>
      <Warning message="Invalid address format" show={value?.length !== 0 && !isValid} mt={1} />
    </>
  );
};

export default AddressInput;
