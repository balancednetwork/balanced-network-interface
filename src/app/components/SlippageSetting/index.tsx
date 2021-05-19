import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';

// enum SlippageError {
//   InvalidInput = 'InvalidInput',
//   RiskyLow = 'RiskyLow',
//   RiskyHigh = 'RiskyHigh',
// }

// enum DeadlineError {
//   InvalidInput = 'InvalidInput',
// }

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  display: none;
  ${({ theme }) => theme.mediaWidth.upSmall`
     display: inline;
   `}
`;

const SlippageInput = styled(Flex)`
  height: 32px;
  color: ${({ theme, color }) => (color === '#fb6a6a' ? '#fb6a6a' : theme.colors.text1)};
  outline: none;
  border-radius: 8px;
  border: 2px solid #0c2a4d;
  background-color: #0c2a4d;
  transition: border 0.3s ease;
  line-height: 1.15;
  text-align: center;
  align-items: center;

  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;

const Input = styled.input`
  width: 48px;
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
  deadline: number;
  setDeadline: (deadline: number) => void;
}

export default function SlippageSettings({
  rawSlippage,
  setRawSlippage /*,deadline, setDeadline */,
}: SlippageSettingsProps) {
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

  // let deadlineError: DeadlineError | undefined;
  // if (deadlineInput !== '' && !deadlineInputIsValid) {
  //   deadlineError = DeadlineError.InvalidInput;
  // } else {
  //   deadlineError = undefined;
  // }

  function parseCustomSlippage(value: string) {
    setSlippageInput(value);

    try {
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString());
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat <= 1000) {
        setRawSlippage(valueAsIntFromRoundedFloat);
      }
    } catch {}
  }

  // function parseCustomDeadline(value: string) {
  //   setDeadlineInput(value);

  //   try {
  //     const valueAsInt: number = Number.parseInt(value) * 60;
  //     if (!Number.isNaN(valueAsInt) && valueAsInt > 0) {
  //       setDeadline(valueAsInt);
  //     }
  //   } catch {}
  // }

  return (
    <>
      <Flex>
        <Flex p={1}>
          <SlippageInput>
            <Input
              placeholder={(rawSlippage / 100).toFixed(2)}
              value={slippageInput}
              onBlur={() => {
                parseCustomSlippage((rawSlippage / 100).toFixed(2));
              }}
              onChange={e => parseCustomSlippage(e.target.value)}
              color={!slippageInputIsValid ? '#fb6a6a' : ''}
            />
            %
          </SlippageInput>
        </Flex>
      </Flex>
      {!slippageInputIsValid ? (
        <Flex mb={2} ml={2} mr={2}>
          <SlippageEmojiContainer>
            <Box width={1}>
              <Typography as="span" textAlign="center" color={'#fb6a6a'}>
                10% max
              </Typography>
            </Box>
          </SlippageEmojiContainer>
        </Flex>
      ) : null}
    </>
  );
}
