import React, { useEffect } from 'react';

import Logo from '@/app/components2/Logo';
import WalletIcon from '@/assets/icons/wallet.svg';
import { Trans } from '@lingui/macro';

import { Button } from '@/components/ui/button';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import WalletModal from '../WalletModal';

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
          <Button
            onClick={() => modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL)}
            className="bg-[#E6E0F7] rounded-full px-10"
          >
            <span className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
              Sign in
            </span>
          </Button>
        )}

        {wallets.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="icon"
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
