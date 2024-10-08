import React, { useCallback } from 'react';
import { Trans } from '@lingui/macro';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { Modal } from '@/app/components2/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import XTokenList from './XTokenList';
import { PowerIcon } from 'lucide-react';

const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }) => {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  const handleChangeWallet = () => {
    modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL);
  };

  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };

  return (
    <Modal open={open} onDismiss={onDismiss} title="" dialogClassName="max-w-[450px]" hideCloseIcon={true}>
      <div className="flex items-center justify-end gap-2">
        <div className="cursor-pointer text-[#D4C5F9] text-body" onClick={handleChangeWallet}>
          <Trans>Manage wallets</Trans>
        </div>
        <div className="cursor-pointer" onClick={handleDisconnectWallet}>
          <PowerIcon className="w-6 h-6" />
        </div>
      </div>
      <Tabs defaultValue="tokens">
        <TabsList className="gap-2">
          <TabsTrigger
            value="tokens"
            className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
          >
            <div className="text-base font-bold font-['Montserrat']">
              <Trans>Tokens</Trans>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
          >
            <div className="text-base font-bold font-['Montserrat']">
              <Trans>History</Trans>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tokens" className="mt-4">
          <XTokenList />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div>History</div>
        </TabsContent>
      </Tabs>
    </Modal>
  );
};

export default WalletModal;
