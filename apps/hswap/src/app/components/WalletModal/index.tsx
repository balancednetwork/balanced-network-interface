import React, { useCallback } from 'react';
import { isMobile } from 'react-device-detect';

import { Trans } from '@lingui/macro';
import { ChevronsRightIcon, PowerIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { xChainTypes } from '../WalletConnectModal';
import WalletItem from '../WalletConnectModal/WalletItem';
import HistoryItemList from './HistoryItemList';
import { IconWithConfirmTextButton } from './IconWithConfirmTextButton';
import XTokenList from './XTokenList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const WalletModalContent = ({ onDismiss }) => {
  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-[-40px] top-0 bottom-0 h-full items-start py-6"
        onClick={onDismiss}
      >
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
          <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
            <ScrollArea>
              <XTokenList />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
            <ScrollArea>
              <HistoryItemList />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="wallets" className="mt-4">
          <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
            <ScrollArea className="h-full">
              <div className="w-full flex flex-col gap-4 mt-2">
                {xChainTypes.map(wallet => (
                  <WalletItem key={wallet.xChainType} {...wallet} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }) => {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  if (!isMobile) {
    return (
      <Sheet open={open} modal={false}>
        <SheetContent className="flex flex-col gap-2 p-4">
          <WalletModalContent onDismiss={onDismiss} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={_ => onDismiss()}>
      <DrawerContent className="p-4 border-border">
        {/* <DrawerHeader className="text-left px-0">{<DrawerTitle>{title}</DrawerTitle>}</DrawerHeader> */}
        <WalletModalContent onDismiss={onDismiss} />
      </DrawerContent>
    </Drawer>
  );
};

export default WalletModal;
