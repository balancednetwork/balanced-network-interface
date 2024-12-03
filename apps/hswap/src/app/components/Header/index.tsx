import React, { useEffect } from 'react';

import Logo from '@/app/components2/Logo';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import WalletModal from '../WalletModal';
import { WhiteButton } from '@/app/components2/Button';
import { ArrowIcon, ShowIcon } from '@/app/components2/Icons';

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
          <Logo />
        </div>

        {wallets.length === 0 && (
          <WhiteButton onClick={() => modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL)} className="px-4 sm:px-8">
            <span>Sign in</span>
            <ArrowIcon className="fill-[#695682]" />
          </WhiteButton>
        )}

        {wallets.length > 0 && (
          <>
            <WhiteButton onClick={() => modalActions.openModal(MODAL_ID.WALLET_MODAL)} className="px-2 sm:px-8">
              <span>Wallet view</span>
              <ShowIcon />
            </WhiteButton>
            <WalletModal />
          </>
        )}
      </div>
    </header>
  );
}
