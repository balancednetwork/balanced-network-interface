import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { escapeRegExp } from 'utils';

// enum SlippageError {
//   InvalidInput = 'InvalidInput',
//   RiskyLow = 'RiskyLow',
//   RiskyHigh = 'RiskyHigh',
// }

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  display: none;
  ${({ theme }) => theme.mediaWidth.upSmall`
     display: inline;
   `}
`;

const SlippageInput = styled(Flex)`
  width: 100px;
  height: 30px;
  color: ${({ theme, color }) => (color === '#fb6a6a' ? '#fb6a6a' : theme.colors.text1)};
  outline: none;
  border-radius: 8px;
  border: 2px solid rgb(44, 169, 183);
  background-color: #0c2a4d;
  transition: border 0.3s ease;
  line-height: 1.15;
  text-align: center;
  align-items: center;
  overflow: hidden;

  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;

const Input = styled.input`
  width: 80px;
  color: ${({ theme, color }) => (color === '#fb6a6a' ? '#fb6a6a' : theme.colors.text1)};
  outline: none;
  border: none;
  background-color: #0c2a4d;
  transition: border 0.3s ease;
  overflow: visible;
  line-height: 1.15;
  text-align: right;
`;

export interface SlippageSettingsProps {
  rawSlippage: number;
  setRawSlippage: (rawSlippage: number) => void;
}
const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`);
export default function SlippageSettings({ rawSlippage, setRawSlippage }: SlippageSettingsProps) {
  const [slippageInput, setSlippageInput] = React.useState('');
  // const [deadlineInput, setDeadlineInput] = React.useState('');

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2);
  // const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput;

  // let slippageError: SlippageError | undefined;
  // if (slippageInput !== '' && !slippageInputIsValid) {
  //   slippageError = SlippageError.InvalidInput;
  // } else if (slippageInputIsValid && rawSlippage < 50) {
  //   slippageError = SlippageError.RiskyLow;
  // } else if (slippageInputIsValid && rawSlippage > 500) {
  //   slippageError = SlippageError.RiskyHigh;
  // } else {
  //   slippageError = undefined;
  // }
  const handleSlippageInput = (value: string) => {
    if (value === '' || inputRegex.test(escapeRegExp(value))) {
      parseCustomSlippage(value);
    }
  };

  function parseCustomSlippage(value: string) {
    setSlippageInput(value);

    try {
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString());
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat <= 1000) {
        setRawSlippage(valueAsIntFromRoundedFloat);
      }
    } catch {}
  }

  return (
    <Flex flexDirection="column" alignItems="flex-end">
      <SlippageInput>
        <Input
          placeholder={(rawSlippage / 100).toFixed(2)}
          value={slippageInput}
          onBlur={() => {
            parseCustomSlippage((rawSlippage / 100).toFixed(2));
          }}
          onChange={e => {
            handleSlippageInput(e.target.value.replace(/,/g, '.'));
          }}
          color={!slippageInputIsValid ? '#fb6a6a' : ''}
        />
        %
      </SlippageInput>
      {!slippageInputIsValid ? (
        <Flex>
          <SlippageEmojiContainer>
            <Box width={1}>
              <Typography as="span" textAlign="right" color={'#fb6a6a'}>
                10% max
              </Typography>
            </Box>
          </SlippageEmojiContainer>
        </Flex>
      ) : null}
    </Flex>
  );
}
