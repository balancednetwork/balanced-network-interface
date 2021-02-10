import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import { IconButton } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { NotificationsDropdown } from 'app/components/NotificationsDropdown';
import { Typography } from 'app/theme';
import { ReactComponent as NotificationIcon } from 'assets/icons/notification.svg';
import { ReactComponent as WalletIcon } from 'assets/icons/wallet.svg';

import { environments } from '../../../environments';
import { iNotificationsService } from '../../../services/notification';
import { JSONSafeParse } from '../../../utils/jsonSefeParse';

const client = new W3CWebSocket(`ws://${environments.local.api}/ws`);

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

const NotificationWrapper = styled.div`
  position: relative;
`;

const NotificationBadges = styled.span`
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 5px 10px;
  border-radius: 50%;
  background-color: red;
  color: white;
`;

const NotificationButton = styled(IconButton)`
  position: relative;
`;

export function Header(props: { title?: string; className?: string; address?: '' }) {
  const { className, title } = props;
  const [address, updateAddress] = React.useState(localStorage.getItem('a'));
  const [showNoti, updateShowNoti] = React.useState(false);
  const [notifications, updateNotification] = React.useState(Object.values(iNotificationsService.getNotification()));
  const [notiCount, updateNotiCount] = React.useState(0);

  client.onopen = () => {
    if (address) {
      client.send(
        JSON.stringify({
          address,
        }),
      );
    }
  };

  client.onerror = console.error;

  window.onload = () => {
    client.send(
      JSON.stringify({
        address,
      }),
    );
  };

  client.onmessage = message => {
    const data = JSONSafeParse(message.data);
    if (data.from_address) {
      iNotificationsService.addNotification(data);
      updateNotiCount(notiCount + 1);
      console.log(notiCount);

      updateNotification(Object.values(iNotificationsService.getNotification()));
    }
  };

  function eventHandler(event) {
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

  function showNotification() {
    if (!notifications.length) {
      fetch(`http://${environments.local.api}/api/v1/address/history/${address}?offset=0&limit=5`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      })
        .then(d => d.json())
        .then(updateNotification)
        .catch(console.error);
    }
    updateShowNoti(!showNoti);
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

          <NotificationWrapper>
            <NotificationButton onClick={showNotification}>
              <NotificationIcon />
              {notiCount > 0 ? <NotificationBadges>{notiCount}</NotificationBadges> : <></>}
            </NotificationButton>
            {showNoti ? (
              <NotificationsDropdown
                notifications={notifications}
                updateNotification={updateNotification}
                notiCount={notiCount}
                updateNotiCount={updateNotiCount}
              />
            ) : (
              <></>
            )}
          </NotificationWrapper>
        </Flex>
      </Flex>
    </header>
  );
}
