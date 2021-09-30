import React from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { CurrencyValue } from 'app/components/newproposal/FundingInput';
import { Typography } from 'app/theme';

interface Props {
  amounts: CurrencyValue[];
}

export default function Funding({ amounts }: Props) {
  const _amounts: { [key: string]: string[] } = amounts.reduce((acc, { amount, symbol, address }) => {
    return {
      ...acc,
      [address]: [...(acc[address] || []), `${Number(BalancedJs.utils.toIcx(amount).toFixed(2))} ${symbol || ''}`],
    };
  }, {});

  return (
    <>
      <Wrapper>
        <BoxPanel width={'40%'}>
          <Heading variant="p">Send</Heading>
        </BoxPanel>
        <BoxPanel width={'60%'}>
          <Heading variant="p">To</Heading>
        </BoxPanel>
      </Wrapper>
      <List>
        {Object.entries(_amounts).map(values => (
          <Wrapper key={values[0]}>
            <BoxPanel width={'40%'}>
              {values[1].map(currency => (
                <ListItem>
                  <Typography variant="h3">{currency}</Typography>
                </ListItem>
              ))}
            </BoxPanel>
            <BoxPanel width={'60%'}>
              <List>
                <ListItem>
                  <Typography variant="p">{values[0]}</Typography>
                </ListItem>
              </List>
            </BoxPanel>
          </Wrapper>
        ))}
      </List>
    </>
  );
}

const Heading = styled(Typography)`
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  margin-bottom: 9px;
`;
const Wrapper = styled(Flex)`
  align-items: flex-start;
  justify-content: center;
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
  height: 28px;
  ${props => !props.hasTitle && 'justify-content: center;'}

  & > p {
    text-align: right;
  }
  & > h3 {
    ${props => props.hasTitle && 'padding-left: 15px;'}
  }
`;
