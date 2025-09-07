import React, { useCallback } from 'react';

import RecentActivityIcon from '@/assets/icons/anti-clock.svg';
import TickIcon from '@/assets/icons/tick-dark.svg';
import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CHAIN_INFO, SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import ClickAwayListener from 'react-click-away-listener';
import { useLocation, useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled, { keyframes } from 'styled-components';

import { Button, IconButton, PendingIconButton } from '@/app/components/Button';
import Logo from '@/app/components/Logo';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import CopyIcon from '@/assets/icons/copy.svg';
import WalletIcon from '@/assets/icons/wallet.svg';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { shortenAddress } from '@/utils';

import { useFailedTxCount, useIsAnyTxPending, usePendingTxCount } from '@/hooks/useCombinedTransactions';
import { useSignedInWallets } from '@/hooks/useWallets';
import { xChainMap } from '@balancednetwork/xwagmi';
import { bnJs } from '@balancednetwork/xwagmi';
import { Placement } from '@popperjs/core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import RecentActivity from '../RecentActivity';
import { MouseoverTooltip } from '../Tooltip';
import Wallet from '../Wallet';
import { notificationCSS } from '../Wallet/ICONWallets/utils';
import { useHasBTCB } from '../Wallet/useClaimableICX';

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

const WalletButtonWrapper = styled(Box)<{ $hasnotification?: boolean }>`
  position: relative;
  ${({ $hasnotification }) => ($hasnotification ? notificationCSS : '')}
  &::before, &::after {
    left: 7px;
    top: 13px;
    ${({ theme }) => `background-color: ${theme.colors.bg5}`};
  }
`;

export const StyledAddress = styled(Typography)`
  &:hover {
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

const RecentActivityButtonWrapper = styled(Box)<{ $hasnotification?: boolean }>`
  position: relative;
  margin-right: 15px;
  ${({ $hasnotification }) => ($hasnotification ? notificationCSS : '')}
  &::before, &::after {
    left: 7px;
    top: 13px;
    ${({ theme }) => `background-color: ${theme.colors.bg5}`};
  }
`;

const SpinningIcon = styled(RecentActivityIcon)`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-720deg);
    }
  }
  animation: spin 2s ease-in-out infinite;
`;

const gentleSpin = keyframes`
  0% {
    transform: rotate(90deg);
    opacity: 0;
  }
  80% {
    transform: rotate(-390deg);
    opacity: 1;
  }
  100% {
    transform: rotate(-360deg);
    opacity: 1;
  }
`;

const AnimatedTickIcon = styled(TickIcon)`
  animation: ${gentleSpin} 2s cubic-bezier(0.1, 0.9, 0.2, 1);
`;

const IconStage = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  perspective: 500px;
`;

const IconLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 400ms ease-in-out;
  will-change: transform, opacity;
`;

const StyledFlex = styled(Flex)`
  align-items: center;
  position: relative;

  @media(max-width: 550px) {
    align-items: start;
    flex-direction: column;

    .legacy-text {
      padding-top: 0;
      margin-left: 0;
    }
  }
`;

const NETWORK_ID = parseInt(import.meta.env.VITE_NETWORK_ID ?? '1');

type AnimationState = 'IDLE' | 'PENDING' | 'SUCCESS' | 'FADING_OUT_SUCCESS';

export const CopyableAddress = ({
  account,
  closeAfterDelay,
  copyIcon,
  placement = 'left',
}: {
  account: string | null | undefined;
  closeAfterDelay?: number;
  copyIcon?: boolean;
  placement?: Placement;
}) => {
  const [isCopied, updateCopyState] = React.useState(false);
  const copyAddress = React.useCallback(async (account: string) => {
    await navigator.clipboard.writeText(account);
    updateCopyState(true);
  }, []);

  return account ? (
    <MouseoverTooltip
      text={isCopied ? t`Copied` : t`Copy`}
      placement={placement}
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

function useClaimableICX(): UseQueryResult<BigNumber> {
  const { account } = useIconReact();
  const transactions = useAllTransactions();

  return useQuery({
    queryKey: ['claimableICX', account, transactions],
    queryFn: async () => {
      if (!account) return;

      const result = await bnJs.Staking.getClaimableICX(account);
      return BalancedJs.utils.toIcx(result);
    },
    enabled: !!account,
  });
}

export default function Header(props: { title?: string; className?: string }) {
  const { className, title } = props;
  const upSmall = useMedia('(min-width: 600px)');
  const wallets = useSignedInWallets();
  const { data: claimableICX } = useClaimableICX();
  const hasBTCB = useHasBTCB();
  const location = useLocation();
  const isTradeLegacy = location.pathname?.includes('trade-legacy');

  const pendingTxCount = usePendingTxCount();
  const [testPendingCount, setTestPendingCount] = React.useState(0);
  const totalPendingCount = pendingTxCount + testPendingCount;
  const failedTxCount = useFailedTxCount();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const walletButtonRef = React.useRef<HTMLElement>(null);

  const recentActivityButtonRef = React.useRef<HTMLElement>(null);
  const [recentActivityAnchor, setRecentActivityAnchor] = React.useState<HTMLElement | null>(null);

  // Animation state machine
  const [animationState, setAnimationState] = React.useState<AnimationState>('IDLE');
  const previousPendingRef = React.useRef<number>(0);
  const successTimer = React.useRef<ReturnType<typeof setTimeout>>();

  // Animate based on pending tx count
  React.useEffect(() => {
    const previousPending = previousPendingRef.current;
    previousPendingRef.current = totalPendingCount;

    if (totalPendingCount > 0 && animationState !== 'PENDING') {
      clearTimeout(successTimer.current);
      setAnimationState('PENDING');
    } else if (totalPendingCount === 0 && previousPending > 0) {
      // Check if there are failed transactions
      if (failedTxCount > 0) {
        // Don't show success animation if there are failed transactions
        setAnimationState('IDLE');
      } else {
        setAnimationState('SUCCESS');
        successTimer.current = setTimeout(() => {
          setAnimationState('FADING_OUT_SUCCESS');
        }, 2000);
      }
    }
  }, [totalPendingCount, animationState, failedTxCount]);

  const handleTickTransitionEnd = React.useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (animationState === 'FADING_OUT_SUCCESS' && e.propertyName === 'transform') {
        setAnimationState('IDLE');
      }
    },
    [animationState],
  );

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      clearTimeout(successTimer.current);
    };
  }, []);

  const toggleWalletMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (anchor) {
      // If dropdown is open, close it
      setAnchor(null);
    } else {
      // If dropdown is closed, open it
      setAnchor(walletButtonRef.current);
    }
  };
  const closeWalletMenu = useCallback(() => setAnchor(null), []);

  const toggleWalletModal = useWalletModalToggle();

  const handleWalletClose = e => {
    if (!e.target.closest('[data-reach-dialog-overlay]') && !e.target.closest('.has-modal')) {
      setAnchor(null);
    }
  };

  const toggleRecentActivityMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (recentActivityAnchor) {
      // If dropdown is open, close it
      setRecentActivityAnchor(null);
    } else {
      // If dropdown is closed, open it
      setRecentActivityAnchor(recentActivityButtonRef.current);
    }
  };
  const closeRecentActivityMenu = useCallback(() => setRecentActivityAnchor(null), []);

  const isExpanded = animationState === 'PENDING';
  const showSpinner = animationState === 'PENDING' || animationState === 'SUCCESS';
  const showTick = (animationState === 'SUCCESS' || animationState === 'FADING_OUT_SUCCESS') && failedTxCount === 0;
  const showDefault = animationState === 'IDLE' || (totalPendingCount === 0 && failedTxCount > 0);
  const showAlertBackground = failedTxCount > 0;

  const spinnerOpacity = React.useMemo(() => (animationState === 'PENDING' ? 1 : 0), [animationState]);
  const tickOpacity = React.useMemo(() => (showTick ? 1 : 0), [showTick]);
  const tickScale = React.useMemo(() => (animationState === 'SUCCESS' ? 1 : 0), [animationState]);

  return (
    <header className={className}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <StyledLogo />
          <StyledFlex>
            <Typography variant="h1">
              {/* @ts-ignore */}
              <Trans id={title} />
            </Typography>
            {NETWORK_ID !== NetworkId.MAINNET && (
              <Typography variant="h3" color="alert" fontSize={upSmall ? 20 : 9}>
                {CHAIN_INFO[NETWORK_ID].name}
              </Typography>
            )}
            {isTradeLegacy && (
              <Typography className="legacy-text" color="text2" fontSize={16} ml={2} pt={'17px'}>
                {t`Legacy`}
              </Typography>
            )}
          </StyledFlex>
        </Flex>

        {wallets.length === 0 && (
          <Flex alignItems="center">
            <Button onClick={toggleWalletModal}>
              <Trans>Sign in</Trans>
            </Button>
          </Flex>
        )}

        {wallets.length > 0 && (
          <Flex alignItems="center">
            {/* <WalletInfo>
              {upSmall && (
                <>
                  {wallets.length > 1 ? (
                    <>
                      <Typography variant="p" textAlign="right">
                        <Trans>Multi-chain wallet</Trans>
                      </Typography>
                      <ConnectionStatus>
                        {wallets.map(
                          (wallet, index) =>
                            index < 3 && (
                              <span key={index}>
                                {xChainMap[wallet.xChainId].name}
                                {index + 1 < wallets.length ? ', ' : ' '}
                              </span>
                            ),
                        )}
                        {wallets.length > 3 && <span key={4}>& {wallets.length - 3} more</span>}
                      </ConnectionStatus>
                    </>
                  ) : (
                    <>
                      <Typography variant="p" textAlign="right">
                        {wallets[0].xChainId
                          ? t`${xChainMap[wallets[0].xChainId].name} wallet`
                          : t`Unsupported network`}
                      </Typography>
                      <CopyableAddress account={wallets[0].address} />
                    </>
                  )}
                </>
              )}
            </WalletInfo> */}

            <RecentActivityButtonWrapper>
              <ClickAwayListener onClickAway={closeRecentActivityMenu}>
                <div>
                  <PendingIconButton
                    $expanded={isExpanded}
                    $isActive={Boolean(recentActivityAnchor)}
                    $showAlertBackground={showAlertBackground}
                    ref={recentActivityButtonRef}
                    onClick={toggleRecentActivityMenu}
                  >
                    {isExpanded ? (
                      <>
                        <SpinningIcon width="32" height="32" />
                        <Typography
                          color="bg1"
                          style={{ whiteSpace: 'nowrap' }}
                        >{`${totalPendingCount} in progress...`}</Typography>
                      </>
                    ) : (
                      <IconStage>
                        <IconLayer
                          style={{
                            transform: 'scale(1)',
                            opacity: spinnerOpacity,
                          }}
                        >
                          <SpinningIcon width="32" height="32" />
                        </IconLayer>
                        <IconLayer
                          onTransitionEnd={handleTickTransitionEnd}
                          style={{
                            transform: `scale(${tickScale})`,
                            opacity: tickOpacity,
                          }}
                        >
                          <AnimatedTickIcon width="26" height="26" />
                        </IconLayer>
                        <IconLayer style={{ transform: `scale(${showDefault ? 1 : 0})`, opacity: showDefault ? 1 : 0 }}>
                          <RecentActivityIcon width="32" height="32" />
                        </IconLayer>
                      </IconStage>
                    )}
                  </PendingIconButton>

                  {recentActivityAnchor && (
                    <DropdownPopper
                      show={Boolean(recentActivityAnchor)}
                      anchorEl={recentActivityAnchor}
                      placement="bottom-end"
                      offset={[65, 15]}
                      zIndex={5050}
                    >
                      <RecentActivity />
                    </DropdownPopper>
                  )}
                </div>
              </ClickAwayListener>
            </RecentActivityButtonWrapper>

            <WalletButtonWrapper $hasnotification={claimableICX?.isGreaterThan(0) || hasBTCB}>
              <ClickAwayListener onClickAway={e => handleWalletClose(e)}>
                <div>
                  <IconButton ref={walletButtonRef} onClick={toggleWalletMenu} $isActive={Boolean(anchor)}>
                    <WalletIcon />
                  </IconButton>

                  <DropdownPopper
                    show={Boolean(anchor)}
                    anchorEl={anchor}
                    placement="bottom-end"
                    offset={[0, 15]}
                    zIndex={5050}
                  >
                    <Wallet close={closeWalletMenu} />
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
