import React from 'react';

import { Trans } from '@lingui/macro';
import styled from 'styled-components';
import Warning from '../Warning';
import { Box } from 'rebass';

const InputContainer = styled.div`
  display: inline-flex;
  width: 100%;
`;

const AddressInputLabel = styled.button<{ bg?: string }>`
  border: 2px solid ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  background-color: ${({ theme, bg = 'bg4' }) => `${theme.colors[bg]}`};
  display: flex;
  align-items: center;
  width: 60px;
  height: 43px;
  padding: 4px 15px;
  color: #ffffff;
  border-radius: 10px 0 0 10px;
  transition: border 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;
  font-weight: bold;
  justify-content: center;
`;

const AddressInput = styled.input<{ bg?: string }>`
  flex: 1;
  width: 100%;
  height: 43px;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: 2px solid ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  background-color: ${({ theme, bg = 'bg2' }) => `${theme.colors[bg]}`};
  color: #ffffff;
  padding: 7px 20px;
  outline: none;
  transition: border 0.3s ease;
  overflow: visible;
  font-family: inherit;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.15;
  margin: 0; 



  &.invalid {
      border-color: ${({ theme }) => theme.colors.alert} !important;
    }
  
  &:hover, &:focus {
    border: 2px solid #2ca9b7;
  }
`;

interface AddressInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  isValid?: boolean;
  bg?: string;
  className?: string;
  placeholder?: string;
}

export default function AddressInputPanel({
  value,
  onUserInput,
  bg,
  className,
  placeholder,
  isValid = true,
}: AddressInputPanelProps) {
  return (
    <Box width="100%">
      <InputContainer className={className}>
        <AddressInputLabel bg={bg}>
          <Trans>To</Trans>
        </AddressInputLabel>

        <AddressInput
          placeholder={placeholder || 'hx00000...'}
          value={value}
          onChange={event => onUserInput(event.target.value)}
          bg={bg}
          autoComplete="off"
          spellCheck="false"
          className={value.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'}
        />
      </InputContainer>
      <Warning message="Invalid address format" show={value.length !== 0 && !isValid} mt={1} />
    </Box>
  );
}
