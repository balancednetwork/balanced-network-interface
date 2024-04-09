import React, { useEffect, useState } from 'react';

import { BalancedJs, CHAIN_INFO, SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { SupportedXCallChains } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { IconButton, Button } from 'app/components/Button';
import { Link } from 'app/components/Link';
import Logo from 'app/components/Logo';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import { ReactComponent as CopyIcon } from 'assets/icons/copy.svg';
import { ReactComponent as WalletIcon } from 'assets/icons/wallet.svg';
import bnJs from 'bnJs';
import { useWalletModalToggle } from 'store/application/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { shortenAddress } from 'utils';

import ArchwayWallet from '../ArchwayWallet';
import ICONWallet from '../ICONWallet';
import { notificationCSS } from '../ICONWallet/wallets/utils';
import { MouseoverTooltip } from '../Tooltip';

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

const WalletButtonWrapper = styled(Box)<{ hasnotification?: boolean }>`
  position: relative;
  ${({ hasnotification }) => (hasnotification ? notificationCSS : '')}
  &::before, &:after {
    left: 7px;
    top: 13px;
    ${({ theme }) => `background-color: ${theme.colors.bg5}`};
  }
`;

const WalletButton = styled(Link)`
  cursor: pointer;
`;

const WalletWrap = styled(Box)`
  width: 400px;
  max-width: calc(100vw - 4px);
`;
const WalletMenu = styled.div`
  font-size: 14px;
  padding: 25px 25px 15px 25px;
  display: flex;
  flex-wrap: wrap;
`;

const WalletButtons = styled(Flex)`
  display: flex;
  align-items: center;
`;

export const StyledAddress = styled(Typography)`
  :hover {
    color: #2fccdc;
    cursor: pointer;
  }
`;

const ConnectionStatus = styled(Flex)`
  justify-content: flex-end;
  align-items: end;

  span {
    opacity: 0.75;
    ${({ theme }) => theme.colors.text};
  }

  strong,
  span {
    margin-left: 7px;
  }
`;

export const ChainTabs = styled(Flex)`
  justify-content: flex-start;
  align-items: center;
  padding: 0 25px 25px;
`;

export const ChainTabButton = styled(Button)<{ active?: boolean }>`
  padding: 1px 12px;
  border-radius: 100px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.bg3)};
  transition: background-color 0.3s ease;
  margin-right: 10px;

  :hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 1px 12px;
  `}
`;

const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const CopyableAddress = ({
  account,
  closeAfterDelay,
  copyIcon,
}: {
  account: string | null | undefined;
  closeAfterDelay?: number;
  copyIcon?: boolean;
}) => {
  const [isCopied, updateCopyState] = React.useState(false);
  const copyAddress = React.useCallback(async (account: string) => {
    await navigator.clipboard.writeText(account);
    updateCopyState(true);
  }, []);

  return account ? (
    <MouseoverTooltip
      text={isCopied ? t`Copied` : t`Copy address`}
      placement={'left'}
      noArrowAndBorder
      closeAfterDelay={closeAfterDelay}
      zIndex={9999}
    >
      <StyledAddress
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(account)}
      >
        {shortenAddress(account)}
        {copyIcon && <CopyIcon width="13" height="13" style={{ marginLeft: 7, marginRight: 0, marginTop: -4 }} />}
      </StyledAddress>
    </MouseoverTooltip>
  ) : null;
};

export default function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;
  const upSmall = useMedia('(min-width: 600px)');
  const { account, disconnect } = useIconReact();
  const { address: accountArch, disconnect: disconnectKeplr } = useArchwayContext();
  const transactions = useAllTransactions();
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const [initiallyActiveTab, setInitiallyActiveTab] = useState<SupportedXCallChains | null>(null);
  const [activeTab, setActiveTab] = useState<SupportedXCallChains>();
  const signedInWallets = useSignedInWallets();

  useEffect(() => {
    if (account && !initiallyActiveTab) {
      setInitiallyActiveTab('icon');
    } else if (!account && accountArch && !initiallyActiveTab) {
      setInitiallyActiveTab('archway');
    } else if (!initiallyActiveTab && account && accountArch) {
      setActiveTab('icon');
    }
  }, [account, accountArch, initiallyActiveTab]);

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const walletButtonRef = React.useRef<HTMLElement>(null);
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
    disconnectKeplr();

    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }

    // disconnect function includes resetContractLedgerSettings, so put it below the transport.close()
    disconnect();
  };

  const handleWalletClose = e => {
    if (!e.target.closest('[data-reach-dialog-overlay]')) {
      setAnchor(null);
    }
  };

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const handleChainTabClick = (chain: SupportedXCallChains) => {
    setActiveTab(chain);
  };

  const isIconActive =
    signedInWallets.length === 1
      ? signedInWallets.some(wallet => wallet.chain === 'icon')
      : activeTab === 'icon' || (!activeTab && initiallyActiveTab === 'icon');

  const isArchwayActive =
    signedInWallets.length === 1
      ? signedInWallets.some(wallet => wallet.chain === 'archway')
      : activeTab === 'archway' || (!activeTab && initiallyActiveTab === 'archway');

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <Typography variant="h1">
            <Trans id={title} />
          </Typography>
          {NETWORK_ID !== NetworkId.MAINNET && (
            <Typography variant="h3" color="alert" fontSize={upSmall ? 20 : 9}>
              {CHAIN_INFO[NETWORK_ID].name}
            </Typography>
          )}
        </Flex>

        {!account && !accountArch && (
          <Flex alignItems="center">
            <Button onClick={toggleWalletModal}>
              <Trans>Sign in</Trans>
            </Button>
          </Flex>
        )}

        {(account || accountArch) && (
          <Flex alignItems="center">
            <WalletInfo>
              {upSmall && (
                <>
                  {signedInWallets.length > 1 ? (
                    <>
                      <Typography variant="p" textAlign="right">
                        <Trans>Multi-chain wallet</Trans>
                      </Typography>
                      <ConnectionStatus>
                        {signedInWallets.map((wallet, index) => (
                          <span key={index}>
                            {getNetworkDisplayName(wallet.chain)}
                            {index + 1 < signedInWallets.length ? ', ' : ''}
                          </span>
                        ))}
                      </ConnectionStatus>
                    </>
                  ) : (
                    <>
                      <Typography variant="p" textAlign="right">
                        {t`${getNetworkDisplayName(signedInWallets[0].chain)} wallet`}
                      </Typography>
                      <CopyableAddress account={signedInWallets[0].address} />
                    </>
                  )}
                </>
              )}
            </WalletInfo>

            <WalletButtonWrapper hasnotification={claimableICX.isGreaterThan(0)}>
              <ClickAwayListener onClickAway={e => handleWalletClose(e)}>
                <div>
                  <IconButton ref={walletButtonRef} onClick={toggleWalletMenu}>
                    <WalletIcon />
                  </IconButton>

                  <DropdownPopper
                    show={Boolean(anchor)}
                    anchorEl={anchor}
                    placement="bottom-end"
                    offset={[0, 15]}
                    zIndex={5050}
                  >
                    <WalletWrap>
                      <WalletMenu>
                        <Typography variant="h2" mr={'auto'}>
                          <Trans>Wallet</Trans>
                        </Typography>
                        <WalletButtons>
                          <WalletButton onClick={handleChangeWallet}>
                            <Trans>Manage wallets</Trans>
                          </WalletButton>
                          <Typography padding={'0px 5px'}>{' | '}</Typography>
                          <WalletButton onClick={handleDisconnectWallet}>
                            <Trans>Sign out</Trans>
                          </WalletButton>
                        </WalletButtons>
                      </WalletMenu>
                      {signedInWallets.length === 1 && !upSmall && (
                        <Flex justifyContent={'flex-end'} width={'100%'} padding={'2px 25px 25px'}>
                          <CopyableAddress account={signedInWallets[0].address} closeAfterDelay={1000} copyIcon />
                        </Flex>
                      )}
                      {signedInWallets.length > 1 && (
                        <ChainTabs>
                          {signedInWallets.some(wallet => wallet.chain === 'icon') && (
                            <ChainTabButton onClick={() => handleChainTabClick('icon')} active={isIconActive}>
                              ICON
                            </ChainTabButton>
                          )}
                          {signedInWallets.some(wallet => wallet.chain === 'archway') && (
                            <ChainTabButton onClick={() => handleChainTabClick('archway')} active={isArchwayActive}>
                              Archway
                            </ChainTabButton>
                          )}
                        </ChainTabs>
                      )}

                      {isIconActive && <ICONWallet anchor={anchor} setAnchor={setAnchor} />}
                      {isArchwayActive && <ArchwayWallet anchor={anchor} setAnchor={setAnchor} />}
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
