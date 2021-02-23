import React from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { Currency } from 'types';

export const CheckBox = styled(Box)<{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background-color: ${props => (props.isActive ? props.theme.colors.primary : '#03334f')};
`;

const CurrencyInput = styled.div`
  display: inline-flex;
  align-items: center;
  text-align: right;
  border: 2px solid #0c2a4d;
  background-color: #0c2a4d;
  color: #ffffff;
  padding: 3px 20px;
  height: 40px;
  border-radius: 10px;
  outline: none;
  width: 100%;
  -webkit-appearance: none;
  transition: border 0.3s ease;
  overflow: visible;
`;

const Input = styled.input`
  flex: 1;
  width: 100%;
  text-align: right;
  background: transparent;
  border: none;
  color: white;
  outline: none;
  margin-right: 4px;
`;

const CurrencyUnit = styled.span``;

export const CurrencyField: React.FC<{
  id?: string;
  editable: boolean;
  isActive: boolean;
  label: string;
  value: string;
  currency: Currency;
  tooltipText: string;
  onUserInput?: (value: string) => void;
}> = function (props) {
  const { id, isActive, label, value, currency, tooltipText, editable, onUserInput } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUserInput && onUserInput(event.target.value);
  };

  return (
    <Flex id={id} flexDirection="column">
      <Flex alignItems="center">
        <MouseoverTooltip placement="top" text={tooltipText}>
          <Flex>
            <CheckBox isActive={isActive} mr="4px" />
            <Typography variant="p">{label}</Typography>
          </Flex>
        </MouseoverTooltip>
      </Flex>

      {!editable && (
        <Typography variant="p" ml={24} fontSize={18}>
          {`${value} ${currency.symbol}`}
        </Typography>
      )}

      {editable && (
        <CurrencyInput>
          <Input value={value} onChange={handleChange} />
          <CurrencyUnit>{currency.symbol}</CurrencyUnit>
        </CurrencyInput>
      )}
    </Flex>
  );
};
