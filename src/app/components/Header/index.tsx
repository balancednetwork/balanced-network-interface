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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 75px;
    margin-right: 15px;
  `}
`;

const WalletInfo = styled(Box)`
  text-align: 'right';
  margin-right: 15px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`;

const WalletButton = styled(IconButton)`
  margin-right: 25px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`;

export function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Text color="text" fontSize={35} fontWeight="bold">
            {title}
          </Text>
        </Flex>

        <Flex alignItems="center">
          <WalletInfo>
            <Text color="text" fontSize={16}>
              Main
            </Text>
            <Text color="text" fontSize={14}>
              hx28c08b2...2240bc3
            </Text>
          </WalletInfo>

          <WalletButton>
            <WalletIcon />
          </WalletButton>

          <IconButton>
            <NotificationIcon />
          </IconButton>
        </Flex>
      </Flex>
    </header>
  );
}
