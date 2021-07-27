import React from 'react';

import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { IconButton, Button } from 'app/components/Button';
import { Link } from 'app/components/Link';
import Logo from 'app/components/Logo';
import { DropdownPopper } from 'app/components/Popover';
import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as WalletIcon } from 'assets/icons/wallet.svg';
import bnJs from 'bnJs';
import { useWalletModalToggle } from 'store/application/hooks';
import { shortenAddress } from 'utils';

const StyledLogo = styled(Logo)`
  margin-right: 15px;

  ${({ theme }) => theme.mediaWidth.upSmall`
    margin-right: 75px;
  `}
`;

const WalletInfo = styled(Box)`
  text-align: right;
  margin-right: 15px;
  min-height: 42px;
`;

const WalletButtonWrapper = styled.div``;

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

const ChangeWalletButton = styled(Link)`
  cursor: pointer;
`;

const StyledAddress = styled(Typography)`
  :hover {
    color: #2fccdc;
    cursor: pointer;
  }
`;
export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

const NETWORK_NAMES = {
  [NetworkId.MAINNET]: 'Mainet',
  [NetworkId.YEOUIDO]: 'YEOUDIO',
};

export default React.memo(function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;

  const { account, disconnect } = useIconReact();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const walletButtonRef = React.useRef<HTMLElement>(null);

  const [isCopied, updateCopyState] = React.useState(false);

  const toggleWalletMenu = () => {
    setAnchor(anchor ? null : walletButtonRef.current);
  };
  const closeWalletMenu = () => setAnchor(null);

  const toggleWalletModal = useWalletModalToggle();

  const handleChangeWallet = () => {
    closeWalletMenu();
    toggleWalletModal();

    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }
  };

  const handleDisconnectWallet = async () => {
    closeWalletMenu();
    disconnect();
    if (!bnJs.contractSettings.ledgerSettings.transport) {
      bnJs.inject({
        legerSettings: {
          transport: await TransportWebHID.create(),
        },
      });
    }
    bnJs.contractSettings.ledgerSettings.transport.close();
  };

  const copyAddress = React.useCallback(async (account: string) => {
    await navigator.clipboard.writeText(account);
    updateCopyState(true);
  }, []);

  const upSmall = useMedia('(min-width: 800px)');

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Typography variant="h1">{title}</Typography>
          {NETWORK_ID !== NetworkId.MAINNET && (
            <Typography variant="h3" color="alert">
              {NETWORK_NAMES[NETWORK_ID]}
            </Typography>
          )}
        </Flex>

        {!account && (
          <Flex alignItems="center">
            <Button onClick={toggleWalletModal}>Sign in</Button>
          </Flex>
        )}

        {account && upSmall && (
          <Flex alignItems="center">
            <WalletInfo>
              <Typography variant="p" textAlign="right">
                Wallet
              </Typography>
              {account && (
                <MouseoverTooltip text={isCopied ? 'Copied' : 'Copy address'} placement="left">
                  <StyledAddress
                    onMouseLeave={() => {
                      setTimeout(() => updateCopyState(false), 250);
                    }}
                    onClick={() => copyAddress(account)}
                  >
                    {shortenAddress(account)}
                  </StyledAddress>
                </MouseoverTooltip>
              )}
            </WalletInfo>

            <WalletButtonWrapper>
              <ClickAwayListener onClickAway={closeWalletMenu}>
                <div>
                  <IconButton ref={walletButtonRef} onClick={toggleWalletMenu}>
                    <WalletIcon />
                  </IconButton>

                  <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                    <WalletMenu>
                      <ChangeWalletButton onClick={handleChangeWallet}>Change wallet</ChangeWalletButton>
                      <WalletMenuButton onClick={handleDisconnectWallet}>Sign out</WalletMenuButton>
                    </WalletMenu>
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </WalletButtonWrapper>
          </Flex>
        )}
      </Flex>
    </header>
  );
});
