import React from 'react';

import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { CHAIN_INFO, SupportedChainId as NetworkId } from 'packages/BalancedJs';
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

import Wallet from '../Wallet';

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

const WalletButton = styled(Link)`
  cursor: pointer;
`;

const StyledAddress = styled(Typography)`
  :hover {
    color: #2fccdc;
    cursor: pointer;
  }
`;

const WalletWrap = styled(Box)`
  width: 400px;
  max-width: calc(100vw - 4px);
`;
const WalletMenu = styled.div`
  font-size: 14px;
  padding: 25px 25px 15px 25px;
  display: flex;
`;

const WalletButtons = styled(Flex)`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export default function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;
  const upSmall = useMedia('(min-width: 600px)');
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

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Typography variant="h1">{title}</Typography>
          {NETWORK_ID !== NetworkId.MAINNET && (
            <Typography variant="h3" color="alert" fontSize={upSmall ? 20 : 9}>
              {CHAIN_INFO[NETWORK_ID].name}
            </Typography>
          )}
        </Flex>

        {!account && (
          <Flex alignItems="center">
            <Button onClick={toggleWalletModal}>Sign in</Button>
          </Flex>
        )}

        {account && (
          <Flex alignItems="center">
            <WalletInfo>
              {upSmall && (
                <Typography variant="p" textAlign="right">
                  ICON wallet
                </Typography>
              )}
              {account && upSmall && (
                <MouseoverTooltip text={isCopied ? 'Copied' : 'Copy address'} placement="left" noArrowAndBorder>
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

                  <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end" offset={[0, 15]}>
                    <WalletWrap>
                      <WalletMenu>
                        <Typography variant="h2">Wallet</Typography>
                        <WalletButtons>
                          <WalletButton onClick={handleChangeWallet}>Change wallet</WalletButton>
                          <Typography padding={'0px 5px'}>{' | '}</Typography>
                          <WalletButton onClick={handleDisconnectWallet}>Sign out</WalletButton>
                        </WalletButtons>
                      </WalletMenu>
                      <Wallet anchor={anchor} setAnchor={setAnchor} />
                    </WalletWrap>
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </WalletButtonWrapper>
          </Flex>
        )}
      </Flex>
    </header>
  );
}
