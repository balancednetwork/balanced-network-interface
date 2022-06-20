import React from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';

interface AmountItem {
  amount: string;
  address: string;
}

interface Props {
  recipient: string;
  amounts: AmountItem[];
}

export default function Funding({ recipient, amounts }: Props) {
  return (
    <Wrapper>
      <BoxPanel width={'50%'}>
        <Heading variant="p">
          <Trans>Send</Trans>
        </Heading>
        <List>
          {amounts
            .map(({ amount, address }) =>
              CurrencyAmount.fromRawAmount<Token>(SUPPORTED_TOKENS_MAP_BY_ADDRESS[address] as Token, amount),
            )
            .filter((amount: CurrencyAmount<Token>) => amount.greaterThan('0'))
            .map((amount: CurrencyAmount<Token>) => (
              <ListItem key={amount.currency.address}>
                <Typography variant="h3">
                  {amount.toFixed(2, { groupSeparator: ',' })} {amount.currency.symbol}
                </Typography>
              </ListItem>
            ))}
        </List>
      </BoxPanel>
      <BoxPanel width={'50%'}>
        <Heading variant="p">
          <Trans>To</Trans>
        </Heading>
        <Typography variant="p" textAlign="center">
          {recipient}
        </Typography>
      </BoxPanel>
    </Wrapper>
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
