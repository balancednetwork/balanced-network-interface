import React from 'react';

import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { QuestionWrapper } from 'app/components/QuestionHelper';
import Tooltip, { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { MINUS_INFINITY, PLUS_INFINITY, ZERO } from 'constants/index';
import { CurrencyKey } from 'types';
import { escapeRegExp } from 'utils'; // match escaped "." characters via in a non-capturing group

import { StyledSkeleton } from '../ProposalInfo';

export const CheckBox = styled(Box)<{ isActive: boolean }>`
  width: 20px;
  height: 5px;
  border-radius: 5px;
  background-color: ${props => (props.isActive ? props.theme.colors.primary : '#03334f')};
  position: absolute;
  top: -12px;

  ${({ theme }) => theme.mediaWidth.up500`
    width: 20px;
    height: 20px;
    position: static;
    margin-top: 0;
  `}
`;

const CurrencyInput = styled(Box)`
  display: inline-flex;
  align-items: center;
  text-align: right;
  border: 2px solid #0c2a4d;
  background-color: #0c2a4d;
  color: #ffffff;
  padding: 3px 7px;
  height: 40px;
  border-radius: 10px;
  outline: none;
  width: 100%;
  -webkit-appearance: none;
  transition: border 0.3s ease;
  overflow: visible;

  ${({ theme }) => theme.mediaWidth.up500`
    padding: 3px 20px;
  `}
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

export const inputRegex = RegExp(`^\\d+(?:\\\\[.])?\\d*$`); //test for number or [digits].[digits]

export const CurrencyField: React.FC<{
  editable: boolean;
  isActive: boolean;
  label: string;
  value: string;
  currency: CurrencyKey;
  tooltip?: boolean;
  tooltipText?: React.ReactNode;
  noticeText?: string;
  noticeShow?: boolean;
  tooltipWider?: boolean;
  minValue?: BigNumber;
  maxValue?: BigNumber;
  decimalPlaces?: number;
  onUserInput?: (value: string) => void;
}> = function (props) {
  const {
    isActive,
    label,
    value,
    currency,
    tooltip,
    tooltipText,
    tooltipWider,
    noticeText,
    noticeShow,
    editable,
    minValue = MINUS_INFINITY,
    maxValue = PLUS_INFINITY,
    decimalPlaces = 2,
    onUserInput,
  } = props;
  const smallSp = useMedia('(max-width: 359px)');
  const isSmall = !useMedia('(min-width: 500px)');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUserInput = event.target.value.replace(/,/g, '.');

    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      let nextInput = nextUserInput;
      const value = new BigNumber(nextUserInput || '0');

      if (value.isGreaterThan(maxValue)) {
        nextInput = maxValue.dp(decimalPlaces).toFixed();
      } else if (value.isLessThan(minValue)) {
        nextInput = minValue.dp(decimalPlaces).toFixed();
      }

      onUserInput && onUserInput(nextInput);
    }
  };

  return (
    <Flex flexDirection="column">
      <Flex alignItems="center">
        <Flex alignItems="center" sx={{ position: 'relative' }}>
          <CheckBox isActive={isActive} mr={2} />
          <Typography as="label" htmlFor={label} unselectable="on" sx={{ userSelect: 'none' }}>
            {label}{' '}
            {tooltip && (
              <MouseoverTooltip wide={tooltipWider} text={tooltipText} placement="top">
                {!smallSp && (
                  <QuestionWrapper>
                    <QuestionIcon width={14} style={{ marginTop: -5 }} />
                  </QuestionWrapper>
                )}
              </MouseoverTooltip>
            )}
          </Typography>
        </Flex>
      </Flex>

      {!editable && (
        <Typography variant="p" ml={isSmall ? 0 : 6} mt={1} fontSize={[16, 16, 16, 18]}>
          {value !== 'NaN' ? (
            `${BigNumber.max(new BigNumber(value), ZERO).dp(decimalPlaces).toFormat()} ${currency}`
          ) : (
            <StyledSkeleton width={80} animation="wave" />
          )}
        </Typography>
      )}

      {editable &&
        (noticeShow ? (
          <Tooltip containerStyle={{ width: 'auto' }} placement="bottom" text={noticeText} show={true}>
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
          </Tooltip>
        ) : (
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
        ))}
    </Flex>
  );
};
