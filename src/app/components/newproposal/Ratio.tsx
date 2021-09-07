import React, { useEffect } from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { PROPOSAL_CONFIG } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';
import { useProposalType } from 'store/proposal/hooks';

import Tooltip from '../Tooltip';

export interface Recipient {
  name?: string;
  percent: string;
}

interface RatioValue {
  name?: string;
  percent: string;
}
interface RatioProps {
  onRatioChange: (value, name) => void;
  showErrorMessage?: boolean;
  value?: { [key: string]: string };
  message?: string;
}
export default function Ratio({ onRatioChange, showErrorMessage = false, value, message }: RatioProps) {
  const [ratioValues, setRatioValues] = React.useState<Array<RatioValue> | undefined>();
  const [tooltipPosition, setTooltipPosition] = React.useState('');

  const selectedProposalType = useProposalType();

  useEffect(() => {
    if (selectedProposalType !== 'Text') {
      (async () => {
        const result = await PROPOSAL_CONFIG[selectedProposalType].fetchInputData();

        setRatioValues(result);
      })();
    } else {
      setRatioValues([]);
    }
  }, [selectedProposalType]);

  const handleChange = name => e => {
    const ratioInput = e.target.value.replace(/,/g, '.');
    const isNumberValid = /^\d+(?:[.])?\d*$/.test(ratioInput);
    const nextRatioInput = isNumberValid ? ratioInput : ratioInput.replace(/[^0-9.]/g, '');
    const formatDecimal = nextRatioInput.match(/^\d+(?:[.])?\d{0,2}/);
    onRatioChange((formatDecimal && formatDecimal[0]) || nextRatioInput, name);
    setTooltipPosition(name ?? '');
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
                <ListItem key={name + percent} hasTitle={!!name}>
                  {name && <Typography variant="p">{name === 'Loans' ? 'Borrower' : name}</Typography>}
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
              {ratioValues.map(({ name, percent }, index) => (
                <Tooltip
                  key={name + percent}
                  containerStyle={{ width: 'auto' }}
                  refStyle={{ display: 'block' }}
                  placement="right"
                  text={message}
                  show={showErrorMessage && (name || index) === tooltipPosition}
                >
                  <ListItem hasTitle={!!name}>
                    {name && <Typography variant="p">{name}</Typography>}
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
                      pattern="^[0-9]*[.,]?[0-9]*$"
                      minLength={1}
                      maxLength={6}
                      spellCheck="false"
                    />
                  </ListItem>
                </Tooltip>
              ))}
            </List>
          </BoxPanel>
        </>
      )}
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  align-items: flex-start;
  justify-content: center;
  max-width: 460px;
  margin: 50px auto;
`;
const BoxPanel = styled(Box)`
  &:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    margin-right: 25px;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ListItem = styled.li<{ hasTitle?: boolean }>`
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

const FieldInput = styled.input<{ hasTitle?: boolean }>`
  border-radius: 10px;
  width: 100%;
  max-width: ${props => (props.hasTitle ? '70px' : '100px')};
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 14px;
  text-align: center;
  margin-left: ${props => (props.hasTitle ? '15px' : '0')};
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
`;
