import React from 'react';

import { Text, Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { IconButton } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { ReactComponent as NotificationIcon } from 'assets/icons/notification.svg';
import { ReactComponent as WalletIcon } from 'assets/icons/wallet.svg';

const StyledLogo = styled(Logo)`
  width: 100px;
  margin-left: 7px;
  margin-right: 75px;
`;

const HeaderWrapper = styled.header``;

export function Header(props: { title?: string; className?: string } = { title: 'Home' }) {
  const { className, title } = props;

  return (
    <HeaderWrapper className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Text color="text" fontSize={35} fontWeight="bold">
            {title}
          </Text>
        </Flex>

        <Flex alignItems="center">
          <Box style={{ textAlign: 'right', marginRight: 15 }}>
            <Text color="text" fontSize={16}>
              Main
            </Text>
            <Text color="text" fontSize={14}>
              hx28c08b2...2240bc3
            </Text>
          </Box>

          <IconButton style={{ marginRight: 25 }}>
            <WalletIcon />
          </IconButton>

          <IconButton>
            <NotificationIcon />
          </IconButton>
        </Flex>
      </Flex>
    </HeaderWrapper>
  );
}
