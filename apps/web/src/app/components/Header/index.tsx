import React, { useCallback } from 'react';

import { CHAIN_INFO, SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { Trans, t } from '@lingui/macro';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';

import { Button, IconButton } from '@/app/components/Button';
import { DropdownPopper } from '@/app/components/Popover';
import Logo from '@/app/components2/Logo';
import { Typography } from '@/app/theme';
import CopyIcon from '@/assets/icons/copy.svg';
import WalletIcon from '@/assets/icons/wallet.svg';
import { useWalletModalToggle } from '@/store/application/hooks';
import { shortenAddress } from '@/utils';

import { useSignedInWallets } from '@/hooks/useWallets';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { Placement } from '@popperjs/core';
import { MouseoverTooltip } from '../Tooltip';
import Wallet from '../Wallet';

const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

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
      <Typography
        className="hover:text-[#2fccdc] cursor-pointer flex"
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(account)}
      >
        {shortenAddress(account)}
        {copyIcon && <CopyIcon width="13" height="13" style={{ marginLeft: 7, marginRight: 0, marginTop: -4 }} />}
      </Typography>
    </MouseoverTooltip>
  ) : null;
};

export default function Header(props: { className?: string }) {
  const { className } = props;
  const upSmall = useMedia('(min-width: 600px)');
  const wallets = useSignedInWallets();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const walletButtonRef = React.useRef<HTMLElement>(null);

  const toggleWalletMenu = () => {
    setAnchor(anchor ? null : walletButtonRef.current);
  };
  const closeWalletMenu = useCallback(() => setAnchor(null), []);

  const toggleWalletModal = useWalletModalToggle();

  const handleWalletClose = e => {
    if (!e.target.closest('[data-reach-dialog-overlay]') && !e.target.closest('.has-modal')) {
      setAnchor(null);
    }
  };

  return (
    <header className={className}>
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="mr-4 sm:mr-20">
            <Logo />
          </div>

          {NETWORK_ID !== NetworkId.MAINNET && (
            <Typography variant="h3" color="alert" fontSize={upSmall ? 20 : 9}>
              {CHAIN_INFO[NETWORK_ID].name}
            </Typography>
          )}
        </div>

        {wallets.length === 0 && (
          <div className="flex items-center">
            <Button onClick={toggleWalletModal}>
              <Trans>Sign in</Trans>
            </Button>
          </div>
        )}

        {wallets.length > 0 && (
          <div className="flex items-center">
            <div className="text-left mr-4 min-h-11">
              {upSmall && (
                <>
                  {wallets.length > 1 ? (
                    <>
                      <Typography variant="p" textAlign="right">
                        <Trans>Multi-chain wallet</Trans>
                      </Typography>
                      <div className="flex justify-end items-end">
                        {wallets.map(
                          (wallet, index) =>
                            index < 3 && (
                              <span className="opacity-75" key={index}>
                                {xChainMap[wallet.xChainId].name}
                                {index + 1 < wallets.length ? ', ' : ' '}
                              </span>
                            ),
                        )}
                        {wallets.length > 3 && <span key={4}>& {wallets.length - 3} more</span>}
                      </div>
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
            </div>

            <div className="relative before:left-2 before:top-3 before:bg-[#021338] after:left-2 after::top-3 after:bg-[#021338]">
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
                    <Wallet close={closeWalletMenu} />
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
