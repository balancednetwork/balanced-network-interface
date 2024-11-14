import React, { useEffect } from 'react';

import Logo from '@/app/components2/Logo';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import WalletModal from '../WalletModal';
import { WhiteButton } from '@/app/components2/Button';
import ArrowIcon from '@/assets/icons2/arrow.svg';
import ShowIcon from '@/assets/icons2/show.svg';

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
          <WhiteButton onClick={() => modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL)}>
            <span>Sign in</span>
            <ArrowIcon />
          </WhiteButton>
        )}

        {wallets.length > 0 && (
          <>
            <WhiteButton onClick={() => modalActions.openModal(MODAL_ID.WALLET_MODAL)}>
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
