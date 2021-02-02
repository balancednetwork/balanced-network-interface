import React from 'react';

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

export function Header(props: { title?: string; className?: string; address?: '' }) {
  const { className, title } = props;
  const [address, updateAddress] = React.useState(localStorage.getItem('a'));

  function eventHandler(event) {
    console.log(event);

    const type = event.detail.type;
    const payload = event.detail.payload;
    switch (type) {
      // case 'RESPONSE_HAS_ACCOUNT':
      // case 'RESPONSE_HAS_ADDRESS':
      case 'RESPONSE_ADDRESS':
        localStorage.setItem('a', payload);
        updateAddress(payload);
        break;
      // case 'RESPONSE_JSON-RPC':
      // case 'CANCEL_JSON-RPC':
      // case 'RESPONSE_SIGNING':
      // case 'CANCEL_SIGNING':

      default:
        break;
    }
  }

  React.useEffect(() => {
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler, false);
    return () => {
      document.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler);
    };
  });

  function callIconexWallet(e) {
    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_ADDRESS',
        },
      }),
    );
  }

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
            <Typography>{address}</Typography>
          </WalletInfo>

          <WalletButton onClick={callIconexWallet}>
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
