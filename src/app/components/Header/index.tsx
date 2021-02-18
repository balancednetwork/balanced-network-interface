import React from 'react';

import { request } from 'iconex';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { IconButton } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { Typography } from 'app/theme';
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

  const [address, setAddress] = React.useState();

  const handleWalletIconClick = async (_event: React.MouseEvent) => {
    const detail = await request({
      type: 'REQUEST_ADDRESS',
    });

    setAddress(detail.payload);
  };

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Typography variant="h1">{title}</Typography>
        </Flex>

        <Flex alignItems="center">
          <WalletInfo>
            <Typography variant="p" textAlign="right">
              Wallet
            </Typography>
            {address && <Typography>{address}</Typography>}
          </WalletInfo>

          <WalletButton onClick={handleWalletIconClick}>
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
