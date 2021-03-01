import React from 'react';

import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { IconButton, Button } from 'app/components/Button';
import { Link } from 'app/components/Link';
import Logo from 'app/components/Logo';
import { DropdownPopper } from 'app/components/Popover';
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

const WalletButtonWrapper = styled.div`
  margin-right: 25px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`;

const WalletMenu = styled.div`
  max-width: 160px;
  font-size: 14px;
  padding: 25px;
  display: grid;
  grid-template-rows: auto;
  grid-gap: 20px;
`;

const WalletMenuButton = styled(Button)`
  padding: 7px 25px;
`;

export default React.memo(function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;

  const { account, requestAddress } = useIconReact();

  const handleWalletIconClick = async (_event: React.MouseEvent) => {
    if (!account) requestAddress();
    else {
      toggleWalletMenu();
    }
  };

  const handleNotification = () => {};

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const walletButtonRef = React.useRef<HTMLElement>(null);
  const toggleWalletMenu = () => {
    setAnchor(anchor ? null : walletButtonRef.current);
  };
  const closeWalletMenu = () => setAnchor(null);

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

          <WalletButtonWrapper>
            <ClickAwayListener onClickAway={closeWalletMenu}>
              <div>
                <IconButton ref={walletButtonRef} onClick={handleWalletIconClick}>
                  <WalletIcon />
                </IconButton>

                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                  <WalletMenu>
                    <Link href="#">Change wallet</Link>
                    <WalletMenuButton>Sign Out</WalletMenuButton>
                  </WalletMenu>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </WalletButtonWrapper>

          <IconButton onClick={handleNotification}>
            <NotificationIcon />
          </IconButton>
        </Flex>
      </Flex>
    </header>
  );
});
