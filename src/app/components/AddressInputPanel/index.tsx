import React from 'react';

import { Trans } from '@lingui/macro';
import styled from 'styled-components';

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
  width: 120px;
  height: 43px;
  padding: 4px 15px;
  color: #ffffff;
  border-radius: 10px 0 0 10px;
  transition: border 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;
  font-weight: bold;
  justify-content: center;
`;

const AddressInput = styled.input<{ bg?: string; drivenOnly?: boolean }>`
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

  ${({ drivenOnly }) => drivenOnly && `cursor: default;`};

  ${({ drivenOnly }) =>
    !drivenOnly &&
    `
    :hover, :focus {
      border: 2px solid #2ca9b7;
    }
  `};
`;

interface AddressInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  bg?: string;
  className?: string;
  placeholder?: string;
  drivenOnly?: boolean;
}

export default function AddressInputPanel({
  value,
  onUserInput,
  bg,
  className,
  placeholder,
  drivenOnly,
}: AddressInputPanelProps) {
  return (
    <InputContainer className={className}>
      <AddressInputLabel bg={bg}>
        <Trans>Address</Trans>
      </AddressInputLabel>

      <AddressInput
        placeholder={drivenOnly ? '' : placeholder || 'hx00000...'}
        value={value}
        onChange={event => onUserInput(event.target.value)}
        bg={bg}
        drivenOnly={drivenOnly}
      />
    </InputContainer>
  );
}
