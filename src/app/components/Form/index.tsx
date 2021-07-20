import React from 'react';

import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { QuestionWrapper } from 'app/components/QuestionHelper';
import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { ZERO } from 'constants/index';
import { CurrencyKey } from 'types';
import { escapeRegExp } from 'utils'; // match escaped "." characters via in a non-capturing group

export const CheckBox = styled(Box)<{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background-color: ${props => (props.isActive ? props.theme.colors.primary : '#03334f')};
`;

const CurrencyInput = styled(Box)`
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

const NumberInput = styled.input`
  flex: 1;
  width: 100%;
  text-align: right;
  background: transparent;
  border: none;
  color: white;
  outline: none;
  padding-right: 4px;
`;

const CurrencyUnit = styled.span``;

const inputRegex = RegExp(`^\\d+(?:\\\\[.])?\\d*$`);

export const CurrencyField: React.FC<{
  id?: string;
  editable: boolean;
  isActive: boolean;
  label: string;
  value: string;
  currency: CurrencyKey;
  tooltip?: boolean;
  tooltipText?: React.ReactNode;
  tooltipWider?: boolean;
  maxValue?: string;
  onUserInput?: (value: string) => void;
}> = function (props) {
  const {
    id,
    isActive,
    label,
    value,
    currency,
    tooltip,
    tooltipText,
    tooltipWider,
    editable,
    maxValue,
    onUserInput,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUserInput = event.target.value.replace(/,/g, '.');

    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      if (maxValue && nextUserInput) {
        if (parseFloat(nextUserInput) < parseFloat(maxValue)) {
          onUserInput && onUserInput(nextUserInput);
        } else {
          onUserInput && onUserInput(maxValue);
        }
      } else {
        onUserInput && onUserInput(nextUserInput);
      }
    }
  };

  return (
    <Flex id={id} flexDirection="column">
      <Flex alignItems="center">
        <Flex alignItems="center">
          <CheckBox isActive={isActive} mr={2} />
          <Typography as="label" htmlFor={label} unselectable="on" sx={{ userSelect: 'none' }}>
            {label}{' '}
            {tooltip && (
              <MouseoverTooltip wide={tooltipWider} text={tooltipText} placement="top">
                <QuestionWrapper>
                  <QuestionIcon width={14} style={{ marginTop: -5 }} />
                </QuestionWrapper>
              </MouseoverTooltip>
            )}
          </Typography>
        </Flex>
      </Flex>

      {!editable && (
        <Typography variant="p" ml={6} mt={1} fontSize={[16, 16, 16, 18]}>
          {`${BigNumber.max(new BigNumber(value), ZERO).dp(2).toFormat()} ${currency}`}
        </Typography>
      )}

      {editable && (
        <CurrencyInput mt={1}>
          <NumberInput
            id={label}
            value={value}
            onChange={handleChange}
            // universal input options
            inputMode="decimal"
            title="Token Amount"
            autoComplete="off"
            autoCorrect="off"
            // text-specific options
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            minLength={1}
            maxLength={79}
            spellCheck="false"
          />
          <CurrencyUnit>{currency}</CurrencyUnit>
        </CurrencyInput>
      )}
    </Flex>
  );
};
