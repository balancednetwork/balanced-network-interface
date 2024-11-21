import React, { useCallback } from 'react';

import WalletItem, { WalletItemProps } from './WalletItem';
import { Modal } from '@/app/components2/Modal';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { EVMWalletModal } from './EVMWalletModal';
import { InjectiveWalletOptionsModal } from './InjectiveWalletOptionsModal';
import { SuiWalletOptionsModal } from './SuiWalletOptionsModal';
import { ScrollArea } from '@/components/ui/scroll-area';

export const xChainTypes: WalletItemProps[] = [
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
    name: 'Stellar wallets',
    xChainType: 'STELLAR',
  },
  {
    name: 'Solana wallets',
    xChainType: 'SOLANA',
  },
  {
    name: 'Icon wallets',
    xChainType: 'ICON',
  },
];

export default function WalletConnectModal({ modalId = MODAL_ID.WALLET_CONNECT_MODAL }) {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  return (
    <>
      <Modal
        open={open}
        onDismiss={onDismiss}
        title="Sign in with"
        dialogClassName="max-w-[350px]"
        className="bg-[#D4C5F9]/30 backdrop-blur-[50px] border-none"
      >
        <ScrollArea className="h-[600px]">
          <div className="w-full flex flex-col gap-4 mt-2">
            {xChainTypes.map(wallet => (
              <WalletItem key={wallet.xChainType} {...wallet} />
            ))}
          </div>
        </ScrollArea>
      </Modal>
      <EVMWalletModal />
      <InjectiveWalletOptionsModal />
      <SuiWalletOptionsModal />
    </>
  );
}
