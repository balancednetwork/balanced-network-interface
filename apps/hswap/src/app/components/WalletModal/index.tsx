import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { Trans } from '@lingui/macro';
import { ChevronsRightIcon, PowerIcon } from 'lucide-react';
import React, { useCallback } from 'react';
import HistoryItemList from './HistoryItemList';
import XTokenList from './XTokenList';
import { xChainTypes } from '../WalletConnectModal';
import WalletItem from '../WalletConnectModal/WalletItem';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
    <Sheet open={open} modal={false}>
      <SheetContent className="flex flex-col gap-2">
        <div className="absolute left-[-40px] top-[50px] cursor-pointer" onClick={onDismiss}>
          <ChevronsRightIcon className="w-6 h-6" />
        </div>

        <div className="flex items-center justify-end gap-2">
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
            <TabsTrigger
              value="wallets"
              className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
            >
              <div className="text-base font-bold font-['Montserrat']">
                <Trans>Wallets</Trans>
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tokens" className="mt-4">
            <div className="flex flex-col justify-between">
              <XTokenList />
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <div className="flex flex-col">
              <HistoryItemList />
            </div>
          </TabsContent>
          <TabsContent value="wallets" className="mt-4">
            <div className="w-full flex flex-col gap-4 mt-2">
              {xChainTypes.map(wallet => (
                <WalletItem key={wallet.xChainType} {...wallet} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default WalletModal;
