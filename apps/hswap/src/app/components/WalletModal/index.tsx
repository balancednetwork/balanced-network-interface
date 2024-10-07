import React, { useCallback } from 'react';

import WalletItem, { WalletItemProps } from './WalletItem';
import { Modal } from '@/app/components2/Modal';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { EVMWalletModal } from './EVMWalletModal';
import { InjectiveWalletOptionsModal } from './InjectiveWalletOptionsModal';
import { SuiWalletOptionsModal } from './SuiWalletOptionsModal';

const xChainTypes: WalletItemProps[] = [
  {
    name: 'EVM wallets',
    xChainType: 'EVM',
  },
  {
    name: 'Injective wallets',
    xChainType: 'INJECTIVE',
  },
  {
    name: 'Archway wallets',
    xChainType: 'ARCHWAY',
  },
  {
    name: 'Havah wallets',
    xChainType: 'HAVAH',
  },
  {
    name: 'Sui wallets',
    xChainType: 'SUI',
  },
  {
    name: 'Icon wallets',
    xChainType: 'ICON',
  },
];

export default function WalletModal({ modalId = MODAL_ID.WALLET_MODAL }) {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  return (
    <>
      <Modal open={open} onDismiss={onDismiss} title="Sign in with" dialogClassName="max-w-[450px]">
        <div className="w-full flex flex-col gap-4 mt-2">
          {xChainTypes.map(wallet => (
            <WalletItem key={wallet.xChainType} {...wallet} />
          ))}
        </div>
      </Modal>
      <EVMWalletModal />
      <InjectiveWalletOptionsModal />
      <SuiWalletOptionsModal />
    </>
  );
}
