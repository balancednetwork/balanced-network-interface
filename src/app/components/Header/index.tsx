import React from 'react';

import { useIconReact } from 'packages/icon-react';
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

export default React.memo(function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;

  const { account, requestAddress, hasExtension } = useIconReact();

  const handleWalletIconClick = async (_event: React.MouseEvent) => {
    requestAddress();
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
            {account && <Typography>{shortenAddress(account)}</Typography>}
          </WalletInfo>

          {hasExtension && (
            <WalletButton onClick={handleWalletIconClick}>
              <WalletIcon />
            </WalletButton>
          )}

          {!hasExtension && (
            <WalletButton
              href="https://chrome.google.com/webstore/detail/iconex/flpiciilemghbmfalicajoolhkkenfel?hl=en"
              as="a"
              target="_blank"
            >
              <WalletIcon />
            </WalletButton>
          )}

          <IconButton>
            <NotificationIcon />
          </IconButton>
        </Flex>
      </Flex>
    </header>
  );
});
