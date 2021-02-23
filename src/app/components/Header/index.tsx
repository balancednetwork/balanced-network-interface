import React from 'react';

import { useIconReact } from 'packages/icon-react';
import {
  ICONexRequestEventType,
  ICONEX_RELAY_RESPONSE,
  ICONexResponseEventType,
  ICONEX_RELAY_REQUEST,
} from 'packages/iconex';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { IconButton } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { Typography } from 'app/theme';
import { ReactComponent as NotificationIcon } from 'assets/icons/notification.svg';
import { ReactComponent as WalletIcon } from 'assets/icons/wallet.svg';
import { shortenAddress } from 'utils';

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
  text-align: right;
  margin-right: 15px;
  min-height: 42px;

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

  const [hasExtension, setHasExtension] = React.useState(false);
  const [hasAccount, setHasAccount] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  function handler({ detail }: any) {
    const { type, payload } = detail;
    if (type === ICONexResponseEventType.RESPONSE_HAS_ACCOUNT) {
      handleResponseHasAccount(payload);
    }
  }

  window.addEventListener(ICONEX_RELAY_RESPONSE, handler);

  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(ICONEX_RELAY_REQUEST, {
        detail: {
          type: ICONexRequestEventType.REQUEST_HAS_ACCOUNT,
        },
      }),
    );
  }, 1000);
  // React.useEffect(() => {
  //   return () => window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
  // });

  function handleResponseHasAccount({ hasAccount }) {
    setHasExtension(true);
    setHasAccount(hasAccount);
    setIsChecking(false);
  }

  const { account, requestAddress } = useIconReact();
  console.log(account);
  const handleWalletIconClick = async (_event: React.MouseEvent) => {
    if (isChecking || !hasExtension || !hasAccount || getBrowserName() !== 'chrome') {
      return alert('ICONEX is not installed or Chrome browser is not used');
    }
    requestAddress();
  };

  function getBrowserName() {
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
      case agent.indexOf('edge') > -1:
        return 'edge';
      case agent.indexOf('opr') > -1 && !!window['opr']:
        return 'opera';
      case agent.indexOf('chrome') > -1 && !!window['chrome']:
        return 'chrome';
      case agent.indexOf('trident') > -1:
        return 'ie';
      case agent.indexOf('firefox') > -1:
        return 'firefox';
      case agent.indexOf('safari') > -1:
        return 'safari';
      default:
        return 'other';
    }
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
            {account && <Typography>{shortenAddress(account)}</Typography>}
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
