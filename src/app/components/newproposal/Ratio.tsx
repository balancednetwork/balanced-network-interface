import React, { useEffect } from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { PROPOSAL_CONFIG } from 'app/containers/NewProposalPage';
import { Typography } from 'app/theme';
import { useProposalType } from 'store/proposal/hooks';

import Tooltip from '../Tooltip';

export interface Recipient {
  recipient_name?: string;
  dist_percent: string;
}
interface RatioProps {
  onRecipientChange: (value, recipient_name) => void;
  showErrorMessage?: boolean;
  value?: { [key: string]: string };
}
export default function Ratio({ onRecipientChange, showErrorMessage = false, value }: RatioProps) {
  const [recipients, setRecipients] = React.useState<Array<Recipient> | undefined>();
  const [tooltipPosition, setTooltipPosition] = React.useState('');

  const selectedProposalType = useProposalType();

  useEffect(() => {
    if (selectedProposalType !== 'Text') {
      (async () => {
        const result = await PROPOSAL_CONFIG[selectedProposalType].fetchInputData();
        if (selectedProposalType !== 'BALN allocation') {
          setRecipients(result as Recipient[]);
          return;
        }

        const newResult = Object.entries(result).map(item => ({
          recipient_name: item[0] === 'Loans' ? 'Borrower' : item[0],
          dist_percent: BalancedJs.utils
            .toIcx(item[1] as string)
            .times(100)
            .toFixed(),
        }));

        setRecipients(newResult);
      })();
    } else {
      setRecipients([]);
    }
  }, [selectedProposalType]);

  const handleChange = recipient_name => e => {
    let nextRecipientInput = e.target.value.replace(/,/g, '.');
    console.log('nextRecipientInput', nextRecipientInput);
    const isNumber = /^\d+(?:[.])?\d*$/.test(nextRecipientInput);
    onRecipientChange(isNumber ? nextRecipientInput : nextRecipientInput.replace(/[^0-9.]/g, ''), recipient_name);
    setTooltipPosition(recipient_name || '');
  };

  return (
    <Wrapper>
      {recipients && (
        <>
          <BoxPanel width={1 / 2}>
            <Typography variant="p" textAlign="center" marginBottom="9px">
              Current
            </Typography>
            <List>
              {recipients.map(({ recipient_name, dist_percent }) => (
                <ListItem key={recipient_name + dist_percent} hasTitle={!!recipient_name}>
                  {recipient_name && (
                    <Typography variant="p">{recipient_name === 'Loans' ? 'Borrower' : recipient_name}</Typography>
                  )}
                  <Typography variant="h2">{dist_percent}%</Typography>
                </ListItem>
              ))}
            </List>
          </BoxPanel>
          <BoxPanel width={1 / 2}>
            <Typography variant="p" textAlign="center" marginBottom="9px">
              New
            </Typography>
            <List>
              {recipients.map(({ recipient_name, dist_percent }) => (
                <Tooltip
                  key={recipient_name + dist_percent}
                  containerStyle={{ width: 'auto' }}
                  refStyle={{ display: 'block' }}
                  placement="right"
                  text="Allocation must equal 100%"
                  show={showErrorMessage && recipient_name === tooltipPosition}
                >
                  <ListItem hasTitle={!!recipient_name}>
                    {recipient_name && <Typography variant="p">{recipient_name}</Typography>}
                    <FieldInput
                      value={value ? value[recipient_name || dist_percent] : ''}
                      hasTitle={!!recipient_name}
                      // universal input options
                      inputMode="decimal"
                      autoComplete="off"
                      autoCorrect="off"
                      onChange={handleChange(recipient_name || dist_percent)}
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
