import React, { useEffect } from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { MAX_RATIO_VALUE, PROPOSAL_CONFIG, PROPOSAL_TYPE } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';

import Tooltip from '../Tooltip';

export interface Recipient {
  name?: string;
  percent: string;
}

export interface RatioValue {
  name?: string;
  percent: string | number;
}
interface RatioProps {
  onRatioChange: (value, name) => void;
  showErrorMessage?: boolean;
  value?: { [key: string]: string };
  message?: string;
  proposalType: PROPOSAL_TYPE;
  setInitialValue: (initValue: { [key: string]: string }) => void;
}

export default function RatioInput({
  onRatioChange,
  showErrorMessage = false,
  value,
  message,
  proposalType,
  setInitialValue,
}: RatioProps) {
  const [ratioValues, setRatioValues] = React.useState<Array<RatioValue> | undefined>();

  useEffect(() => {
    if (proposalType !== PROPOSAL_TYPE.TEXT && proposalType !== PROPOSAL_TYPE.FUNDING) {
      (async () => {
        const result = await PROPOSAL_CONFIG[proposalType].fetchInputData();
        setRatioValues(result);
        const initValue = (result as Array<RatioValue>).reduce(
          (acc, cur, idx) => ({ ...acc, [cur.name || idx]: '' }),
          {},
        );
        initValue && setInitialValue(initValue);
      })();
    } else {
      setRatioValues([]);
    }
  }, [proposalType, setInitialValue]);

  const handleChange = name => e => {
    const ratioInput = e.target.value.replace(/,/g, '.');
    const isNumberValid = /^\d+(?:[.])?\d*$/.test(ratioInput);
    const nextRatioInput = isNumberValid ? ratioInput : ratioInput.replace(/[^0-9.]/g, '');
    if (nextRatioInput > MAX_RATIO_VALUE) return;
    const formatDecimal = nextRatioInput.match(/^\d+(?:[.])?\d{0,2}/);
    onRatioChange((formatDecimal && formatDecimal[0]) || nextRatioInput, name);
  };

  return (
    <Wrapper>
      {ratioValues && (
        <>
          <BoxPanel width={1 / 2}>
            <Typography variant="p" textAlign="center" marginBottom="9px">
              Current
            </Typography>
            <List>
              {ratioValues.map(({ name, percent }) => (
                <ListItem key={(name || '') + percent} hasTitle={!!name}>
                  {name && <Typography variant="p">{name}</Typography>}
                  <Typography variant="h2">{percent}%</Typography>
                </ListItem>
              ))}
            </List>
          </BoxPanel>
          <BoxPanel width={1 / 2}>
            <Typography variant="p" textAlign="center" marginBottom="9px">
              New
            </Typography>
            <List>
              {ratioValues.map(({ name, percent }, index) =>
                index === ratioValues.length - 1 ? (
                  <Tooltip
                    key={(name || '') + percent}
                    containerStyle={{ width: 'auto' }}
                    refStyle={{ display: 'block' }}
                    placement="right"
                    text={message}
                    show={showErrorMessage}
                  >
                    <ListItem hasTitle={!!name}>
                      {name && <Typography variant="p">{name}</Typography>}
                      <InputWrapper>
                        <FieldInput
                          value={(value && value[name || index]) || ''}
                          hasTitle={!!name}
                          // universal input options
                          inputMode="decimal"
                          autoComplete="off"
                          autoCorrect="off"
                          onChange={handleChange(name || index)}
                          // text-specific options
                          type="text"
                          spellCheck="false"
                        />
                      </InputWrapper>
                    </ListItem>
                  </Tooltip>
                ) : (
                  <ListItem hasTitle={!!name} key={(name || '') + percent}>
                    {name && <Typography variant="p">{name}</Typography>}
                    <InputWrapper>
                      <FieldInput
                        value={(value && value[name || index]) || ''}
                        hasTitle={!!name}
                        // universal input options
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        onChange={handleChange(name || index)}
                        // text-specific options
                        type="text"
                        spellCheck="false"
                      />
                    </InputWrapper>
                  </ListItem>
                ),
              )}
            </List>
          </BoxPanel>
        </>
      )}
    </Wrapper>
  );
}

export const Wrapper = styled(Flex)`
  align-items: flex-start;
  justify-content: center;
  max-width: 500px;
  margin: 50px auto;
`;
export const BoxPanel = styled(Box)`
  &:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    margin-right: 25px;
  }
`;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const ListItem = styled.li<{ hasTitle?: boolean }>`
  display: flex;
  align-items: center;
  margin-top: 25px;
  margin-bottom: 5px;
  height: 40px;
  ${props => !props.hasTitle && 'justify-content: center;'}

  & > p {
    text-align: right;
    width: 50%;
  }
  & > h2 {
    ${props => props.hasTitle && 'padding-left: 15px; width: 50%;'}
  }
`;
const InputWrapper = styled.div`
  position: relative;
  &:after {
    content: '%';
    display: inline-block;
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
  }
`;
const FieldInput = styled.input<{ hasTitle?: boolean }>`
  border-radius: 10px;
  width: 100%;
  max-width: ${props => (props.hasTitle ? '80px' : '100px')};
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 20px 3px 10px;
  text-align: center;
  margin-left: ${props => (props.hasTitle ? '15px' : '0')};
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
`;
