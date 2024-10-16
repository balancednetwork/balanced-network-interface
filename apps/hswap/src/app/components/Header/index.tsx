import React, { useEffect } from 'react';

import Logo from '@/app/components2/Logo';
import WalletIcon from '@/assets/icons/wallet.svg';
import { shortenAddress } from '@/utils';
import { Trans, t } from '@lingui/macro';
import { Placement } from '@popperjs/core';

import { Button } from '@/components/ui/button';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { MouseoverTooltip } from '../Tooltip';
import WalletModal from '../WalletModal';

export const CopyableAddress = ({
  account,
  closeAfterDelay,
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
      content={isCopied ? t`Copied` : t`Copy`}
      placement={placement}
      closeAfterDelay={closeAfterDelay}
      zIndex={9999}
    >
      <span
        className="text-light-purple cursor-pointer flex text-body font-[500]"
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(account)}
      >
        {shortenAddress(account, 4)}
      </span>
    </MouseoverTooltip>
  ) : null;
};

export default function Header(props: { className?: string }) {
  const { className } = props;
  const wallets = useSignedInWallets();

  useEffect(() => {
    if (wallets.length === 0) {
      modalActions.closeModal(MODAL_ID.WALLET_MODAL);
    }
  }, [wallets]);

  return (
    <header className={className}>
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="mr-4 sm:mr-20">
            <Logo />
          </div>
        </div>

        {wallets.length === 0 && (
          <Button onClick={() => modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL)} className="rounded-full">
            <Trans>Sign in</Trans>
          </Button>
        )}

        {wallets.length > 0 && (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                modalActions.openModal(MODAL_ID.WALLET_MODAL);
              }}
            >
              <WalletIcon />
            </Button>

            <WalletModal />
          </>
        )}
      </div>
    </header>
  );
}
