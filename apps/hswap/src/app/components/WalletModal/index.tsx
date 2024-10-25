import React, { useCallback } from 'react';

import { Trans } from '@lingui/macro';
import { ChevronsRightIcon, PowerIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { xChainTypes } from '../WalletConnectModal';
import WalletItem from '../WalletConnectModal/WalletItem';
import HistoryItemList from './HistoryItemList';
import { IconWithConfirmTextButton } from './IconWithConfirmTextButton';
import XTokenList from './XTokenList';

const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }) => {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };

  return (
    <Sheet open={open} modal={false}>
      <SheetContent className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" className="absolute left-[-40px] top-[50px]" onClick={onDismiss}>
          <ChevronsRightIcon className="w-6 h-6" />
        </Button>

        <div className="flex items-center justify-end gap-2">
          <IconWithConfirmTextButton
            Icon={<PowerIcon className="w-6 h-6" />}
            text="Disconnect"
            dismissOnHoverOut={true}
            onConfirm={handleDisconnectWallet}
          />
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
